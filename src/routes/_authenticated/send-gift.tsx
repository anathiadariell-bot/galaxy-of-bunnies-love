import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, Check, Lock, Calendar, Eye, EyeOff, Gift, Sparkles,
} from "lucide-react";
import { CozyRoom } from "@/components/galaxy/CozyRoom";
import { Header } from "@/components/galaxy/Header";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { STAR_COLORS, EMOTIONS, type StarColor, type Emotion } from "@/lib/galaxy";
import { canUseGiftLocks, giftLocksMessage } from "@/lib/plans";
import { useProfile, useAuthUser } from "@/hooks/useGalaxyData";
import { supabase } from "@/integrations/supabase/client";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/send-gift")({
  head: () => ({
    meta: [
      { title: "Send a Gift Star — Our Little Galaxy" },
      { name: "description", content: "Craft a glowing Gift Star and share it with someone you love." },
    ],
  }),
  component: SendGiftPage,
});

// ─── Plan constants ───────────────────────────────────────────────────────────

const FREE_COLORS: StarColor[]  = ["rose", "gold", "sky"];
const FREE_EMOTIONS: Emotion[]  = ["love", "joy", "thanks"];
const FREE_MSG_LIMIT            = 200;
const PREMIUM_MSG_LIMIT         = 1000;
const ALL_COLORS                = Object.keys(STAR_COLORS) as StarColor[];
const ALL_EMOTIONS              = EMOTIONS.map((e) => e.key) as Emotion[];

const COLOR_META: Record<StarColor, { label: string; description: string }> = {
  gold:   { label: "Golden Glow",  description: "Warm and radiant"   },
  rose:   { label: "Rose Blush",   description: "Tender and loving"  },
  sky:    { label: "Sky Blue",     description: "Peaceful and dreamy"},
  sage:   { label: "Sage Green",   description: "Grounding and true" },
  blush:  { label: "Soft Blush",   description: "Playful and bright" },
  violet: { label: "Violet Dream", description: "Magical and rare"   },
};

// ─── Deterministic twinkle dots (no Math.random in render) ───────────────────

const TWINKLE_DOTS = [
  { top: 18, left: 22, size: 2.5, delay: 0.0 },
  { top: 28, left: 74, size: 2.0, delay: 0.6 },
  { top: 55, left: 14, size: 3.0, delay: 1.2 },
  { top: 65, left: 68, size: 2.5, delay: 0.3 },
  { top: 78, left: 38, size: 2.0, delay: 1.8 },
  { top: 42, left: 85, size: 1.5, delay: 0.9 },
  { top: 12, left: 52, size: 2.0, delay: 2.1 },
  { top: 82, left: 58, size: 2.5, delay: 1.5 },
];

// ─── PIN hashing (Web Crypto SHA-256) ────────────────────────────────────────
// Phase 3 verify-gift-pin Edge Function will compare with the same algorithm.

async function hashPin(raw: string): Promise<string> {
  const data    = new TextEncoder().encode(raw);
  const buf     = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── StarOrb ─────────────────────────────────────────────────────────────────

function StarOrb({ color, size = 120 }: { color: string; size?: number }) {
  return (
    <div
      className="animate-float-y"
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 38% 32%, white 0%, ${color} 35%, ${color}88 80%)`,
        boxShadow: [
          `0 0 ${Math.round(size * 0.25)}px ${color}`,
          `0 0 ${Math.round(size * 0.6)}px ${color}55`,
          `0 0 ${Math.round(size * 1.2)}px ${color}22`,
        ].join(", "),
        flexShrink: 0,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles style={{ width: size * 0.28, height: size * 0.28, color: "white", opacity: 0.7 }} />
      </div>
      {TWINKLE_DOTS.map((d, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full bg-white"
          style={{
            top: `${d.top}%`, left: `${d.left}%`,
            width: d.size, height: d.size,
            animationDelay: `${d.delay}s`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.10)" }}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-primary)", opacity: 0.8 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Upgrade badge ────────────────────────────────────────────────────────────

function PremiumBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: "oklch(0.82 0.13 300 / 0.25)", color: "oklch(0.82 0.13 300)" }}
    >
      ✨ Premium
    </span>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────

function SuccessView({
  color,
  toName,
  shareUrl,
}: {
  color: StarColor;
  toName: string;
  shareUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const activeColor = STAR_COLORS[color];

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy — please copy the link manually.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeBoot />
      <CozyRoom />
      <Header />

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 30%, ${activeColor}18 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-24">
        <div className="flex w-full max-w-md flex-col items-center gap-8">

          {/* Star orb */}
          <StarOrb color={activeColor} size={140} />

          {/* Heading */}
          <div className="text-center">
            <h1 className="font-elegant text-3xl text-foreground/90">
              Your Gift Star is ready ✨
            </h1>
            <p className="mt-2 text-sm text-foreground/55">
              Share the link with{" "}
              <span className="font-semibold text-foreground/80">{toName}</span>
            </p>
          </div>

          {/* Share link box */}
          <div
            className="w-full rounded-2xl p-5"
            style={{ background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.12)" }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/50">
              Share link
            </p>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 truncate rounded-xl px-3 py-2 font-mono text-xs text-foreground/75 select-all"
                style={{ background: "oklch(0 0 0 / 0.20)", border: "1px solid oklch(1 0 0 / 0.08)" }}
              >
                {shareUrl}
              </div>
              <button
                onClick={copy}
                className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 active:scale-95"
                style={{
                  background: copied ? "oklch(0.87 0.11 160 / 0.25)" : "var(--color-primary)",
                  color: copied ? "oklch(0.87 0.11 160)" : "var(--color-primary-foreground)",
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <p className="mt-3 text-xs text-foreground/40">
              Anyone with this link can open the gift — no account needed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:opacity-80 active:scale-95"
              style={{ background: "oklch(1 0 0 / 0.08)", color: "var(--foreground)" }}
            >
              <Gift size={14} className="mr-1.5 inline-block" />
              Send another Gift Star
            </button>
            <Link
              to="/dashboard"
              className="text-sm text-foreground/45 hover:text-foreground/70 transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function SendGiftPage() {
  const user                    = useAuthUser();
  const { data: profile }       = useProfile();
  const plan                    = profile?.plan ?? "free";
  const canLock                 = canUseGiftLocks(plan);
  const msgLimit                = plan === "premium" ? PREMIUM_MSG_LIMIT : FREE_MSG_LIMIT;
  const allowedColors           = plan === "premium" ? ALL_COLORS : FREE_COLORS;
  const allowedEmotionKeys      = plan === "premium" ? ALL_EMOTIONS : FREE_EMOTIONS;

  // Form state
  const [fromName,    setFromName]    = useState("");
  const [toName,      setToName]      = useState("");
  const [message,     setMessage]     = useState("");
  const [color,       setColor]       = useState<StarColor>("gold");
  const [emotion,     setEmotion]     = useState<Emotion>("love");
  const [unlockDate,  setUnlockDate]  = useState("");
  const [pin,         setPin]         = useState("");
  const [pinVisible,  setPinVisible]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [shareToken,  setShareToken]  = useState<string | null>(null);

  // Pre-fill sender name from profile
  useEffect(() => {
    if (profile?.display_name && !fromName) {
      setFromName(profile.display_name);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.display_name]);

  // Derived
  const activeColor   = STAR_COLORS[color];
  const charsLeft     = msgLimit - message.length;
  const overLimit     = charsLeft < 0;

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSend() {
    if (!user) return;

    const errors: string[] = [];
    if (!fromName.trim()) errors.push("Your name is required.");
    if (!toName.trim())   errors.push("Recipient name is required.");
    if (!message.trim())  errors.push("A message is required.");
    if (overLimit)        errors.push(`Message must be ${msgLimit} characters or less.`);

    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    // Validate date lock: must be in the future
    if (canLock && unlockDate) {
      if (new Date(unlockDate) <= new Date()) {
        toast.error("Unlock date must be in the future.");
        return;
      }
    }

    // Validate PIN
    if (canLock && pin.trim() && pin.trim().length < 4) {
      toast.error("PIN must be at least 4 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      let pinHash: string | null = null;
      if (canLock && pin.trim()) {
        pinHash = await hashPin(pin.trim());
      }

      const { data, error } = await supabase
        .from("gift_stars")
        .insert({
          sender_id:   user.id,
          sender_name: fromName.trim(),
          to_name:     toName.trim(),
          message:     message.trim(),
          color,
          emotion,
          unlock_at:   canLock && unlockDate ? new Date(unlockDate).toISOString() : null,
          pin_hash:    pinHash,
        })
        .select("share_token")
        .single();

      if (error) throw error;
      setShareToken(data.share_token);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (shareToken) {
    const shareUrl = `${window.location.origin}/gift/${shareToken}`;
    return <SuccessView color={color} toName={toName} shareUrl={shareUrl} />;
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  const inputBase: React.CSSProperties = {
    background: "oklch(0 0 0 / 0.20)",
    border: "1px solid oklch(1 0 0 / 0.12)",
    borderRadius: 12,
    color: "var(--foreground)",
    padding: "10px 14px",
    width: "100%",
    outline: "none",
    fontSize: 14,
    transition: "border-color 0.2s",
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeBoot />
      <CozyRoom />
      <Header />

      {/* Ambient color wash that follows the active color */}
      <div
        className="pointer-events-none fixed inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 55% 42% at 50% 18%, ${activeColor}14 0%, transparent 65%)`,
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-lg flex-col gap-6 px-4 pb-20 pt-24">

        {/* Back link */}
        <Link
          to="/dashboard"
          className="flex w-fit items-center gap-1.5 text-sm text-foreground/45 transition-colors hover:text-foreground/70"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>

        {/* Hero */}
        <div className="flex flex-col items-center gap-4 py-2">
          <StarOrb color={activeColor} size={110} />
          <div className="text-center">
            <h1 className="font-elegant text-3xl text-foreground/90">Send a Gift Star</h1>
            <p className="mt-1 text-sm text-foreground/50">
              Craft a glowing star for someone you love.
            </p>
          </div>
        </div>

        {/* ── Names ─────────────────────────────────────────────────────────── */}
        <Section title="Who is this for?">
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-foreground/55">Your name</label>
              <input
                style={inputBase}
                placeholder="From…"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                maxLength={60}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/55">Recipient's name</label>
              <input
                style={inputBase}
                placeholder="To…"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                maxLength={60}
              />
            </div>
          </div>
        </Section>

        {/* ── Message ───────────────────────────────────────────────────────── */}
        <Section title="Your message">
          <textarea
            style={{ ...inputBase, resize: "none", minHeight: 110 }}
            placeholder="Write something from the heart…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {/* Character counter */}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-foreground/35">
              {plan === "free"
                ? "Free plan — 200 character limit"
                : `Up to ${PREMIUM_MSG_LIMIT.toLocaleString()} characters`}
            </p>
            <p
              className="text-xs font-semibold tabular-nums transition-colors"
              style={{ color: overLimit ? "oklch(0.65 0.2 25)" : charsLeft <= 20 ? "oklch(0.78 0.15 60)" : "var(--foreground)" }}
            >
              {Math.abs(charsLeft)}{overLimit ? " over" : ""} / {msgLimit}
            </p>
          </div>
        </Section>

        {/* ── Color picker ──────────────────────────────────────────────────── */}
        <Section title="Choose a colour">
          <div className="grid grid-cols-3 gap-2.5">
            {ALL_COLORS.map((c) => {
              const isAvailable = (allowedColors as string[]).includes(c);
              const isSelected  = color === c;
              const hex         = STAR_COLORS[c];

              return (
                <button
                  key={c}
                  disabled={!isAvailable}
                  onClick={() => isAvailable && setColor(c)}
                  className="relative flex flex-col items-center gap-2 rounded-xl py-3 text-center transition-all duration-200 active:scale-95"
                  style={{
                    background: isSelected
                      ? `${hex}28`
                      : "oklch(1 0 0 / 0.04)",
                    border: `1.5px solid ${isSelected ? hex : "oklch(1 0 0 / 0.10)"}`,
                    opacity: isAvailable ? 1 : 0.45,
                    cursor: isAvailable ? "pointer" : "default",
                  }}
                >
                  {/* Swatch */}
                  <div
                    className="rounded-full"
                    style={{
                      width: 28, height: 28,
                      background: `radial-gradient(circle at 38% 32%, white 0%, ${hex} 45%, ${hex}88 100%)`,
                      boxShadow: isSelected ? `0 0 10px ${hex}88` : undefined,
                    }}
                  />
                  <span className="text-xs font-medium text-foreground/75">
                    {COLOR_META[c].label.split(" ")[0]}
                  </span>

                  {/* Lock overlay for premium-only */}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-end justify-center rounded-xl pb-1.5">
                      <Lock size={10} className="text-foreground/40" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {plan === "free" && (
            <p className="mt-3 text-center text-xs text-foreground/35">
              Sage, Blush, and Violet are{" "}
              <span style={{ color: "oklch(0.82 0.13 300)" }}>Premium</span> colours.
            </p>
          )}
        </Section>

        {/* ── Emotion picker ────────────────────────────────────────────────── */}
        <Section title="Set the mood">
          <div className="grid grid-cols-3 gap-2.5">
            {EMOTIONS.map((e) => {
              const isAvailable = (allowedEmotionKeys as string[]).includes(e.key);
              const isSelected  = emotion === e.key;

              return (
                <button
                  key={e.key}
                  disabled={!isAvailable}
                  onClick={() => isAvailable && setEmotion(e.key as Emotion)}
                  className="relative flex flex-col items-center gap-1.5 rounded-xl py-3 text-center transition-all duration-200 active:scale-95"
                  style={{
                    background: isSelected
                      ? "oklch(1 0 0 / 0.10)"
                      : "oklch(1 0 0 / 0.04)",
                    border: `1.5px solid ${isSelected ? activeColor : "oklch(1 0 0 / 0.10)"}`,
                    opacity: isAvailable ? 1 : 0.45,
                    cursor: isAvailable ? "pointer" : "default",
                    boxShadow: isSelected ? `0 0 8px ${activeColor}44` : undefined,
                  }}
                >
                  <span className="text-xl leading-none">{e.emoji}</span>
                  <span className="text-xs font-medium text-foreground/75">{e.label}</span>

                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-end justify-center rounded-xl pb-1.5">
                      <Lock size={10} className="text-foreground/40" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {plan === "free" && (
            <p className="mt-3 text-center text-xs text-foreground/35">
              Memory, Dream, and Milestone are{" "}
              <span style={{ color: "oklch(0.82 0.13 300)" }}>Premium</span> moods.
            </p>
          )}
        </Section>

        {/* ── Lock options ──────────────────────────────────────────────────── */}
        <Section title="Lock options">
          {canLock ? (
            <div className="flex flex-col gap-5">

              {/* Date lock */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Calendar size={14} className="text-foreground/55" />
                  <span className="text-sm font-medium text-foreground/80">Unlock by date</span>
                </div>
                <p className="mb-2.5 text-xs text-foreground/45">
                  The message is revealed in the UI only after this date.
                </p>
                <input
                  type="datetime-local"
                  style={inputBase}
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                />
                {unlockDate && (
                  <button
                    className="mt-1.5 text-xs text-foreground/35 hover:text-foreground/55 transition-colors"
                    onClick={() => setUnlockDate("")}
                  >
                    Remove date lock
                  </button>
                )}
              </div>

              {/* PIN lock */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Lock size={14} className="text-foreground/55" />
                  <span className="text-sm font-medium text-foreground/80">Unlock by PIN</span>
                </div>
                <p className="mb-2.5 text-xs text-foreground/45">
                  The recipient must enter this PIN to reveal the message. Min 4 characters.
                </p>
                <div className="relative">
                  <input
                    type={pinVisible ? "text" : "password"}
                    style={{ ...inputBase, paddingRight: 40 }}
                    placeholder="Set a PIN…"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={20}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                    onClick={() => setPinVisible((v) => !v)}
                    tabIndex={-1}
                  >
                    {pinVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pin && (
                  <button
                    className="mt-1.5 text-xs text-foreground/35 hover:text-foreground/55 transition-colors"
                    onClick={() => setPin("")}
                  >
                    Remove PIN lock
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* Locked state for free users */
            <div className="flex flex-col items-center gap-3 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Lock size={16} className="text-foreground/40" />
                <PremiumBadge />
              </div>
              <p className="max-w-xs text-sm text-foreground/50">
                {giftLocksMessage()}
              </p>
            </div>
          )}
        </Section>

        {/* ── Send button ───────────────────────────────────────────────────── */}
        <button
          onClick={handleSend}
          disabled={isSubmitting || overLimit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          style={{
            background: isSubmitting
              ? "oklch(1 0 0 / 0.10)"
              : `linear-gradient(135deg, ${activeColor}cc 0%, ${activeColor} 100%)`,
            color: "white",
            boxShadow: isSubmitting ? "none" : `0 4px 24px ${activeColor}55`,
          }}
        >
          {isSubmitting ? (
            <>
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
              Sending…
            </>
          ) : (
            <>
              <Gift size={18} />
              Send Gift Star
            </>
          )}
        </button>

      </div>
    </div>
  );
}
