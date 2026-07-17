import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Gift, Lock, Calendar, Sparkles, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { CozyRoom } from "@/components/galaxy/CozyRoom";
import { Header } from "@/components/galaxy/Header";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { STAR_COLORS, EMOTIONS, type StarColor, type Emotion } from "@/lib/galaxy";
import { supabase } from "@/integrations/supabase/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// STAR_COLORS values are oklch functional strings, e.g. "oklch(0.85 0.13 20)".
// Appending hex digits like `${color}88` produces invalid CSS that browsers drop.
// This helper inserts the alpha properly: oklch(L C H) → oklch(L C H / alpha).
function oa(color: string, alpha: number): string {
  return color.replace(")", ` / ${alpha})`);
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/gift/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "A Gift Star — Our Little Galaxy" },
      { name: "description", content: "Someone sent you a glowing Gift Star." },
    ],
  }),
  component: GiftPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface GiftStarPublic {
  id: string;
  sender_name: string;
  to_name: string;
  message: string;
  color: string;
  emotion: string;
  share_token: string;
  unlock_at: string | null;
  has_pin_lock: boolean;
  created_at: string;
}

// ─── Deterministic twinkle dots ───────────────────────────────────────────────

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

// ─── Intro animation constants ────────────────────────────────────────────────

type OpenPhase = "intro" | "wake" | "arc" | "burst" | "revealed";

// 12-point starburst burst particles. bx/by are CSS pixel strings for --bx/--by vars.
const BURST_PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 - Math.PI / 2; // start from top
  const r     = i % 2 === 0 ? 64 : 44;                 // alternating near/far
  return {
    bx:    `${Math.round(Math.cos(angle) * r)}px`,
    by:    `${Math.round(Math.sin(angle) * r)}px`,
    size:  [6, 4, 3, 5][i % 4],
    delay: `${(i % 5) * 0.04}s`,
    white: i % 2 !== 0,
  };
});

// Trail dots: overlay-absolute positions matching the arc keyframe waypoints.
// Arc: (50%, 50%) → (+28px,+5vh) → (-14px,+13vh) → (+22px,+22vh) → (0,+30vh)
const TRAIL_DOTS = [
  { left: "calc(50% + 14px)",  top: "calc(50% + 4vh)",  size: 4.0, delay: "0.00s" },
  { left: "calc(50% + 22px)",  top: "calc(50% + 8vh)",  size: 2.5, delay: "0.20s" },
  { left: "calc(50% + 6px)",   top: "calc(50% + 12vh)", size: 4.5, delay: "0.35s" },
  { left: "calc(50% - 10px)",  top: "calc(50% + 16vh)", size: 3.0, delay: "0.50s" },
  { left: "calc(50% + 4px)",   top: "calc(50% + 20vh)", size: 2.5, delay: "0.65s" },
  { left: "calc(50% + 18px)",  top: "calc(50% + 24vh)", size: 3.5, delay: "0.80s" },
  { left: "calc(50% + 8px)",   top: "calc(50% + 28vh)", size: 2.0, delay: "0.95s" },
];

// ─── StarOrb (same as send-gift) ─────────────────────────────────────────────

function StarOrb({ color, size = 120 }: { color: string; size?: number }) {
  // Architecture: replace the large circular orb div with a tiny bright-point core.
  // The circle boundary of a large orb creates a visible disc because the CozyRoom
  // background image shows through the transparent interior, contrasting with the
  // exterior glow. A tiny core (20% of size) fades to transparent well inside its
  // own border-radius — the circular boundary is invisible. All atmospheric presence
  // comes from edgeless blurred gradient layers (no border-radius).
  const core = Math.round(size * 0.2);         // 24 px — tiny bright point
  const outerSpread = Math.round(size * 1.2);  // outer haze extends this far past the wrapper

  return (
    <div
      className="animate-float-y"
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      {/* ── Outer atmospheric haze: no border-radius, large blur → completely edgeless ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -outerSpread,
          // Gradient does the shaping; blur dissolves any edge that might remain.
          background: `radial-gradient(circle at 50% 50%, ${oa(color, 0.6)} 0%, ${oa(color, 0.3)} 18%, ${oa(color, 0.1)} 36%, ${oa(color, 0)} 55%)`,
          filter: `blur(${Math.round(size * 0.95)}px)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Inner bloom: tighter, less blurred — the "warm glow" zone ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -Math.round(size * 0.35),
          background: `radial-gradient(circle at 50% 50%, white 0%, ${color} 12%, ${oa(color, 0.35)} 30%, ${oa(color, 0)} 52%)`,
          filter: `blur(${Math.round(size * 0.22)}px)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Bright-point core: very small circle, fades to transparent at 75% of its own
              radius — the circular clip is in a fully transparent zone, never perceptible ── */}
      <div
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: core, height: core,
          borderRadius: "50%",
          background: `radial-gradient(circle at 45% 42%, white 0%, white 18%, ${color} 48%, ${oa(color, 0)} 75%)`,
          boxShadow: `0 0 5px 2px white, 0 0 10px ${color}`,
          zIndex: 1,
        }}
      />

      {/* ── Sparkles icon centered in the glow ── */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
        <Sparkles style={{ width: size * 0.22, height: size * 0.22, color: "white", opacity: 0.8 }} />
      </div>

      {/* ── Twinkle dots scattered in the glow area ── */}
      {TWINKLE_DOTS.map((d, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full bg-white"
          style={{
            top: `${d.top}%`, left: `${d.left}%`,
            width: d.size, height: d.size,
            animationDelay: `${d.delay}s`,
            opacity: 0.85,
            zIndex: 2,
          }}
        />
      ))}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeBoot />
      <CozyRoom />
      <Header />

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 30%, ${oa(color, 0.09)} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-24">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Intro overlay ────────────────────────────────────────────────────────────

/**
 * Full-screen fixed overlay that runs the star intro sequence.
 * Uses a 3-div centering sandwich so the CSS animation transform and
 * the -50% centering offset never conflict:
 *   anchor (top:50% left:50%)  →  center (translate -50%,-50%)  →  motion (animation)
 */
function GiftIntroOverlay({
  phase,
  color,
}: {
  phase: Exclude<OpenPhase, "revealed">;
  color: string;
}) {
  const starAnimation =
    phase === "intro" ? "gift-appear 0.7s cubic-bezier(0.34,1.56,0.64,1) both" :
    phase === "wake"  ? "gift-wake 1.1s ease-in-out both" :
    phase === "arc"   ? "gift-arc 1.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards" :
    /* burst — star hidden, particles take over */ "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* ── Animated star (hidden during burst) ── */}
      {phase !== "burst" && (
        // Anchor: reference point at the viewport centre
        <div style={{ position: "absolute", top: "50%", left: "50%" }}>
          {/* Centering: aligns the 140 × 140 StarOrb centre with the anchor */}
          <div style={{ transform: "translate(-50%, -50%)" }}>
            {/* Motion: animation translates from (0,0) = centred position */}
            <div style={{ animation: starAnimation }}>
              <StarOrb color={color} size={140} />
            </div>
          </div>
        </div>
      )}

      {/* ── Sparkle trail (arc phase only) ── */}
      {phase === "arc" && TRAIL_DOTS.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.left,
            top:  d.top,
            transform: "translate(-50%, -50%)",
            width:  d.size,
            height: d.size,
            borderRadius: "50%",
            background:   "white",
            boxShadow: `0 0 ${Math.round(d.size * 2.5)}px ${Math.ceil(d.size)}px ${oa(color, 0.65)}`,
            animation: `gift-trail-dot 0.9s ease-out ${d.delay} both`,
          }}
        />
      ))}

      {/* ── Burst: flash + particles centred at the arc endpoint (50% + 30vh) ── */}
      {phase === "burst" && (
        <div
          style={{
            position: "absolute",
            top:  "calc(50% + 30vh)",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Flash orb */}
          <div
            style={{
              position: "absolute",
              width: 30, height: 30,
              marginLeft: -15, marginTop: -15,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 24px 12px ${oa(color, 0.55)}, 0 0 60px 20px ${oa(color, 0.22)}`,
              animation: "gift-burst-flash 0.6s ease-out both",
            }}
          />

          {/* Particles */}
          {BURST_PARTICLES.map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: p.size, height: p.size,
                marginLeft: -p.size / 2, marginTop: -p.size / 2,
                borderRadius: "50%",
                background:   p.white ? "white" : color,
                boxShadow:   `0 0 ${p.size * 2}px ${oa(color, 0.65)}`,
                animationName:           "gift-burst-particle",
                animationDuration:       "0.65s",
                animationTimingFunction: "ease-out",
                animationDelay:          p.delay,
                animationFillMode:       "both",
                "--bx": p.bx,
                "--by": p.by,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Open-gift view (owns the intro state machine) ────────────────────────────

function GiftOpenView({ gift, activeColor }: { gift: GiftStarPublic; activeColor: string }) {
  const emotionMeta = EMOTIONS.find((e) => e.key === gift.emotion) ?? EMOTIONS[0];
  const [phase, setPhase] = useState<OpenPhase>("intro");

  useEffect(() => {
    // Phase timeline:
    //   0 ms  → "intro"  (star appears, spring scale-up)
    // 700 ms  → "wake"   (star surges brighter)
    // 1800 ms → "arc"    (star sweeps arc downward, trail dots form)
    // 3200 ms → "burst"  (flash + particles at arc endpoint)
    // 3550 ms → "revealed" (overlay gone, content fades in)
    const t1 = setTimeout(() => setPhase("wake"),      700);
    const t2 = setTimeout(() => setPhase("arc"),      1800);
    const t3 = setTimeout(() => setPhase("burst"),    3200);
    const t4 = setTimeout(() => setPhase("revealed"), 3550);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  return (
    <Shell color={activeColor}>
      {/* Intro overlay — fixed on top during the animation phases */}
      {phase !== "revealed" && (
        <GiftIntroOverlay phase={phase} color={activeColor} />
      )}

      {/* Gift content — invisible while the animation plays, then fades in */}
      <div
        className="flex w-full flex-col items-center gap-8"
        style={{
          opacity:      phase === "revealed" ? 1 : 0,
          animation:    phase === "revealed"
            ? "gift-content-reveal 0.9s cubic-bezier(0.22,1,0.36,1) both"
            : "none",
          pointerEvents: phase === "revealed" ? "auto" : "none",
        }}
      >
        <StarOrb color={activeColor} size={140} />

        {/* Heading */}
        <div className="text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-foreground/40">
            {emotionMeta.emoji} {emotionMeta.label}
          </p>
          <h1 className="font-elegant text-3xl text-foreground/90">
            For {gift.to_name} ✨
          </h1>
          <p className="mt-1.5 text-sm text-foreground/55">
            From <span className="font-semibold text-foreground/80">{gift.sender_name}</span>
          </p>
        </div>

        {/* Message card */}
        <div
          className="w-full rounded-2xl p-6"
          style={{ background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.12)" }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">
            Message
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {gift.message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-foreground/30">
            Sent with love via Our Little Galaxy
          </p>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/65 transition-colors"
          >
            <Gift size={12} />
            Create your own Galaxy
          </Link>
        </div>
      </div>
    </Shell>
  );
}

// ─── PIN hashing (must match send-gift.tsx) ───────────────────────────────────

async function hashPin(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Main page ────────────────────────────────────────────────────────────────

function GiftPage() {
  const { token } = Route.useParams();

  const [gift,        setGift]        = useState<GiftStarPublic | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);

  // PIN gate state
  const [pin,         setPin]         = useState("");
  const [pinVisible,  setPinVisible]  = useState(false);
  const [pinError,    setPinError]    = useState("");
  const [pinChecking, setPinChecking] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);

  // ── Load gift ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("gift_stars_public")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setGift(data as GiftStarPublic);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeColor  = gift ? (STAR_COLORS[gift.color as StarColor] ?? STAR_COLORS.gold) : STAR_COLORS.gold;
  const emotionMeta  = gift ? (EMOTIONS.find((e) => e.key === gift.emotion) ?? EMOTIONS[0]) : EMOTIONS[0];
  const isDateLocked = gift?.unlock_at ? new Date(gift.unlock_at) > new Date() : false;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Shell color={STAR_COLORS.gold}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          <p className="text-sm text-foreground/50">Opening your gift…</p>
        </div>
      </Shell>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────

  if (notFound || !gift) {
    return (
      <Shell color={STAR_COLORS.gold}>
        <StarOrb color={STAR_COLORS.gold} size={100} />
        <div className="text-center">
          <h1 className="font-elegant text-2xl text-foreground/80">Gift not found</h1>
          <p className="mt-2 text-sm text-foreground/50">
            This link may have expired or been removed.
          </p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-foreground/45 hover:text-foreground/70 transition-colors"
        >
          <ArrowLeft size={14} />
          Go home
        </Link>
      </Shell>
    );
  }

  // ── Date locked ───────────────────────────────────────────────────────────

  if (isDateLocked) {
    const unlockDate = new Date(gift.unlock_at!);
    const formatted  = unlockDate.toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    });

    return (
      <Shell color={activeColor}>
        <StarOrb color={activeColor} size={120} />
        <div className="text-center">
          <h1 className="font-elegant text-2xl text-foreground/80">
            A gift is waiting for you, {gift.to_name} ✨
          </h1>
          <p className="mt-2 text-sm text-foreground/50">
            From <span className="font-semibold text-foreground/75">{gift.sender_name}</span>
          </p>
        </div>

        <div
          className="flex w-full flex-col items-center gap-3 rounded-2xl p-6 text-center"
          style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.10)" }}
        >
          <Calendar size={22} style={{ color: activeColor, opacity: 0.85 }} />
          <p className="text-sm font-semibold text-foreground/80">This gift is sealed until</p>
          <p className="text-base font-bold" style={{ color: activeColor }}>{formatted}</p>
          <p className="text-xs text-foreground/40">Come back then to open it.</p>
        </div>
      </Shell>
    );
  }

  // ── PIN locked (gate) ─────────────────────────────────────────────────────

  if (gift.has_pin_lock && !pinUnlocked) {
    async function checkPin() {
      if (pin.trim().length < 4) {
        setPinError("PIN must be at least 4 characters.");
        return;
      }
      setPinChecking(true);
      setPinError("");

      try {
        const enteredHash = await hashPin(pin.trim());
        const { data, error } = await supabase.functions.invoke("verify-gift-pin", {
          body: { share_token: token, pin_hash: enteredHash },
        });

        if (error || !data?.ok) {
          setPinError("Incorrect PIN. Please try again.");
        } else {
          setPinUnlocked(true);
        }
      } catch {
        setPinError("Could not verify PIN right now. Please try again.");
      } finally {
        setPinChecking(false);
      }
    }

    const inputBase: React.CSSProperties = {
      background: "oklch(0 0 0 / 0.20)",
      border: "1px solid oklch(1 0 0 / 0.12)",
      borderRadius: 12,
      color: "var(--foreground)",
      padding: "10px 14px",
      width: "100%",
      outline: "none",
      fontSize: 14,
    };

    return (
      <Shell color={activeColor}>
        <StarOrb color={activeColor} size={120} />
        <div className="text-center">
          <h1 className="font-elegant text-2xl text-foreground/80">
            A gift is waiting for you, {gift.to_name} ✨
          </h1>
          <p className="mt-2 text-sm text-foreground/50">
            From <span className="font-semibold text-foreground/75">{gift.sender_name}</span>
          </p>
        </div>

        <div
          className="flex w-full flex-col gap-4 rounded-2xl p-6"
          style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.10)" }}
        >
          <div className="flex items-center gap-2">
            <Lock size={15} style={{ color: activeColor, opacity: 0.8 }} />
            <p className="text-sm font-semibold text-foreground/80">Enter the PIN to open</p>
          </div>

          <div className="relative">
            <input
              type={pinVisible ? "text" : "password"}
              style={{ ...inputBase, paddingRight: 40 }}
              placeholder="Enter PIN…"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(""); }}
              onKeyDown={(e) => e.key === "Enter" && checkPin()}
              maxLength={20}
              autoFocus
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

          {pinError && (
            <p className="text-xs font-medium" style={{ color: "oklch(0.65 0.2 25)" }}>
              {pinError}
            </p>
          )}

          <button
            onClick={checkPin}
            disabled={pinChecking || pin.trim().length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${oa(activeColor, 0.8)} 0%, ${activeColor} 100%)`,
              color: "white",
              boxShadow: `0 4px 16px ${oa(activeColor, 0.27)}`,
            }}
          >
            {pinChecking ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Lock size={14} />
            )}
            {pinChecking ? "Checking…" : "Unlock Gift"}
          </button>
        </div>
      </Shell>
    );
  }

  // ── Open gift — delegates to GiftOpenView which owns the intro animation ──

  return <GiftOpenView gift={gift} activeColor={activeColor} />;
}
