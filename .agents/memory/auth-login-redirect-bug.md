---
name: Auth login redirect bug fix
description: Why login immediately bounced back to /auth, and the three-part fix applied.
---

# Auth login redirect bug — root causes and fixes

## Bug summary
After successful login, the app immediately redirected back to `/auth`.

## Root cause 1 — `getUser()` in `beforeLoad` (fragile network call)
`_authenticated/route.tsx` used `supabase.auth.getUser()` as the session gate.
`getUser()` makes a live HTTP request to Supabase's `/auth/v1/user` endpoint.
Any transient network failure, or calling it before a session is established, returns
no user → `throw redirect({ to: "/auth" })` fires even for a logged-in user.

**Fix:** replaced with `supabase.auth.getSession()` which reads from localStorage —
no network, never fails transiently, and is fast enough for a route guard.

## Root cause 2 — OAuth callback race condition
`signInWithOAuth` had `redirectTo: ${origin}/dashboard`. Supabase sends the user
back to `/dashboard?code=PKCE_CODE`. TanStack Router immediately ran `beforeLoad`
for `/_authenticated`, calling `getUser()` before Supabase had time to exchange the
PKCE code for a session. `getUser()` returned null → redirect to `/auth`.
The code was never redeemed.

**Fix:** created `src/routes/auth-callback.tsx` (flat top-level, no `_authenticated`
wrapper) and pointed `redirectTo` to `${origin}/auth-callback`. The callback listens
for `SIGNED_IN` via `onAuthStateChange`, then navigates to `/dashboard`. `INITIAL_SESSION`
with null is intentionally ignored — it fires before the PKCE exchange completes.

## Root cause 3 — `router.invalidate()` on `SIGNED_IN`
`__root.tsx` called `router.invalidate()` on `SIGNED_IN`, which re-ran `beforeLoad`
immediately after login. With the old `getUser()` guard this could race. Even with
`getSession()` it was unnecessary — navigation after sign-in is handled by `auth.tsx`
and `auth-callback.tsx` directly.

**Fix:** `router.invalidate()` now only fires on `SIGNED_OUT` (to kick users off
protected routes). `SIGNED_IN`/`USER_UPDATED` only invalidate query cache.

## Files changed
- `src/routes/_authenticated/route.tsx` — `getUser()` → `getSession()`
- `src/routes/auth.tsx` — `redirectTo` → `/auth-callback`
- `src/routes/__root.tsx` — narrowed `router.invalidate()` to `SIGNED_OUT` only
- `src/routes/auth-callback.tsx` — new file, OAuth landing + code exchange handler

**Why:** `getSession()` is correct for route guards (local, fast, reliable).
`getUser()` is for server-side validation where you need Supabase to confirm the JWT
is still valid — not appropriate in a client-side navigation guard.
