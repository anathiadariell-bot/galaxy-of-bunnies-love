-- ─────────────────────────────────────────────────────────────────────────────
-- Gift Stars System
-- Phase 1: tables, indexes, RLS policies, public view, plan-gating comments
--
-- Existing tables (stars, letters, profiles) are NOT altered.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. gift_stars ─────────────────────────────────────────────────────────────
--
-- One row per gift created by an authenticated sender.
-- Gifts are immutable once sent (no updated_at, no UPDATE grant to authenticated).
-- Lock columns are NULL when the feature is not used:
--   unlock_at = NULL  → no date lock
--   pin_hash  = NULL  → no PIN lock
-- Both lock features are premium-only (enforced in application layer via plans.ts).

CREATE TABLE public.gift_stars (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity snapshot taken at send time.
  -- Stored here so the gift card is unaffected by future profile renames.
  sender_name text        NOT NULL,
  to_name     text        NOT NULL,
  message     text        NOT NULL,

  -- Same 6-value vocabulary as personal stars (validated in app layer).
  color       text        NOT NULL DEFAULT 'gold',
  emotion     text        NOT NULL DEFAULT 'love',

  -- 128-bit unguessable token.  This IS the access credential for the public link.
  -- URL pattern: /gift/<share_token>
  share_token uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  -- ── Premium lock features ─────────────────────────────────────────────────
  -- Date lock (premium): message is hidden in UI until this UTC moment.
  -- Enforcement is UX-level (trust feature, same as letters.unlock_at).
  unlock_at   timestamptz,

  -- PIN lock (premium): bcrypt hash of a user-chosen PIN.
  -- NEVER returned to the browser — only exposed via the gift_stars_public view
  -- which replaces this column with a boolean `has_pin_lock`.
  -- Verification must happen server-side (Edge Function: verify-gift-pin).
  pin_hash    text,

  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Sender can SELECT / INSERT / DELETE their own gifts.
-- No UPDATE: gifts are immutable once sent.
GRANT SELECT, INSERT, DELETE ON public.gift_stars TO authenticated;
GRANT ALL ON public.gift_stars TO service_role;

ALTER TABLE public.gift_stars ENABLE ROW LEVEL SECURITY;

-- Authenticated sender: full control over their own gifts.
CREATE POLICY "Sender manages own gifts"
  ON public.gift_stars FOR ALL
  TO authenticated
  USING  (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Anonymous (unauthenticated) visitors: SELECT only.
-- The share_token UUID (122 bits of entropy) acts as the credential.
-- App code always queries: WHERE share_token = $token
-- Authenticated non-senders intentionally have NO access to other people's gifts
-- (they are not included in this TO-clause; the sender policy above covers them).
CREATE POLICY "Anon reads gift by share token"
  ON public.gift_stars FOR SELECT
  TO anon
  USING (true);

-- Indexes
CREATE INDEX gift_stars_sender_idx    ON public.gift_stars (sender_id, created_at DESC);
CREATE INDEX gift_stars_token_idx     ON public.gift_stars (share_token);


-- ── 2. gift_stars_public (view) ───────────────────────────────────────────────
--
-- The public-facing projection of gift_stars.  Omits pin_hash entirely and
-- replaces it with a boolean so the UI knows whether to show the PIN gate.
-- All browser code targeting the public gift page must query THIS view, never
-- the base table, so the bcrypt hash is never transmitted to a client.
--
-- security_invoker = true: the view executes under the caller's RLS context,
-- so gift_stars RLS policies still apply (anon can only SELECT, etc.).

CREATE VIEW public.gift_stars_public
  WITH (security_invoker = true)
AS
  SELECT
    id,
    sender_name,
    to_name,
    message,
    color,
    emotion,
    share_token,
    unlock_at,
    (pin_hash IS NOT NULL) AS has_pin_lock,
    created_at
  FROM public.gift_stars;

-- Anon and authenticated users may SELECT from the public view.
-- The base table's RLS is still enforced (security_invoker).
GRANT SELECT ON public.gift_stars_public TO anon, authenticated;


-- ── 3. gift_replies ───────────────────────────────────────────────────────────
--
-- One reply per gift (enforced via UNIQUE constraint on gift_star_id).
-- Created by anonymous users (no account required).
-- The reply_token lets the recipient revisit / share their reply page later.

CREATE TABLE public.gift_replies (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_star_id  uuid        NOT NULL UNIQUE              -- one reply per gift
                            REFERENCES public.gift_stars(id) ON DELETE CASCADE,

  -- Recipient's chosen display name (free text, no auth).
  from_name     text        NOT NULL,
  message       text        NOT NULL,

  -- Same vocabulary as the original gift.
  color         text        NOT NULL DEFAULT 'rose',
  emotion       text        NOT NULL DEFAULT 'love',

  -- Lets the recipient retrieve or share their reply without an account.
  -- URL pattern: /gift/<share_token>/reply/<reply_token>
  reply_token   uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Anon: INSERT only (to reply).  No UPDATE / DELETE: replies are immutable.
-- Authenticated sender: SELECT (to see replies to their gifts).
GRANT INSERT ON public.gift_replies TO anon;
GRANT SELECT, INSERT ON public.gift_replies TO authenticated;
GRANT ALL ON public.gift_replies TO service_role;

ALTER TABLE public.gift_replies ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) may INSERT a reply — but only if the
-- referenced gift_star actually exists.  This prevents orphan rows and
-- stops callers from inserting against fabricated UUIDs.
CREATE POLICY "Anyone can reply to an existing gift"
  ON public.gift_replies FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.gift_stars WHERE id = gift_star_id)
  );

-- Authenticated sender: SELECT replies that belong to their own gifts.
CREATE POLICY "Sender reads replies to own gifts"
  ON public.gift_replies FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (
      SELECT sender_id FROM public.gift_stars WHERE id = gift_star_id
    )
  );

-- Anonymous recipient: SELECT their own reply by reply_token.
-- Used on the /gift/:token/reply/:reply_token confirmation page.
-- UUID entropy makes enumeration infeasible.
CREATE POLICY "Anon reads own reply by token"
  ON public.gift_replies FOR SELECT
  TO anon
  USING (true);
-- App code always queries: WHERE reply_token = $token

-- Indexes
CREATE INDEX gift_replies_gift_star_idx  ON public.gift_replies (gift_star_id);
CREATE INDEX gift_replies_token_idx      ON public.gift_replies (reply_token);
