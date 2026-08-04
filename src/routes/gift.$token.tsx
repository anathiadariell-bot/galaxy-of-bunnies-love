import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Gift, Lock, Calendar, Sparkles, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { CozyRoom } from "@/components/galaxy/CozyRoom";
import { Header } from "@/components/galaxy/Header";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { STAR_COLORS, EMOTIONS, type StarColor, type Emotion } from "@/lib/galaxy";
import { supabase } from "@/integrations/supabase/client";
import bunnyHer from "@/assets/bunny-her-pixel.png";

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

type OpenPhase = "intro" | "wake" | "arc" | "burst" | "card" | "revealed";

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

// ─── CuteStarCharacter — kawaii pixel-art star guide ──────────────────────────
//
// Chubby five-point star with pixel-art shading (R=42, r=26 — chunky inner arms).
// Face: big round sclera eyes with dark pupils, cross-shaped star glints, sleeping
// dash-eyes, spring-open on wake, wink on right eye mid-wake, tiny curved smile,
// generous pink blush circles. Layered SVG shading (gradient highlight + shadow
// rect + prominent pixel highlight blocks) gives the chunky pixel-art look.
// Glow uses edgeless blurred gradients to float cleanly on the night-sky bg.

// Precomputed polygon for R=42, r=26 (chunkier inner arms than before)
const STAR_POINTS = "50,8 65.3,28.9 89.9,37.0 74.7,58.0 74.7,83.9 50,76 25.3,83.9 25.3,58.0 10.1,37.0 34.7,28.9";

function CuteStarCharacter({
  color,
  size = 120,
  phase,
}: {
  color: string;
  size?: number;
  phase: Exclude<OpenPhase, "card" | "revealed">;
}) {
  const sleeping = phase === "intro";
  const waking   = phase === "wake";

  // Shared transform props for SVG element animations (scaleY needs fill-box).
  const pivot: React.CSSProperties = {
    transformBox:    "fill-box",
    transformOrigin: "center",
  };

  return (
    <div
      className={sleeping || waking ? "animate-float-y" : undefined}
      style={{ position: "relative", width: size, height: size }}
    >
      {/* ── Outer atmospheric haze — large radius, heavy blur, no disc edge ── */}
      <div aria-hidden style={{
        position: "absolute",
        inset: -Math.round(size * 0.85),
        background: `radial-gradient(circle at 50% 50%,
          ${oa(color, 0.70)} 0%,
          ${oa(color, 0.35)} 20%,
          ${oa(color, 0.10)} 38%,
          ${oa(color, 0   )} 55%)`,
        filter: `blur(${Math.round(size * 0.78)}px)`,
        pointerEvents: "none",
      }} />

      {/* ── Inner warm bloom — tighter, less blurred ── */}
      <div aria-hidden style={{
        position: "absolute",
        inset: -Math.round(size * 0.18),
        background: `radial-gradient(circle at 47% 43%,
          white              0%,
          ${color}           14%,
          ${oa(color, 0.25)} 32%,
          ${oa(color, 0   )} 52%)`,
        filter: `blur(${Math.round(size * 0.12)}px)`,
        pointerEvents: "none",
      }} />

      {/* ── Sparkle lines during wake — four diagonal dashes radiating outward ── */}
      {waking && (
        <svg
          aria-hidden
          width={size * 2.4} height={size * 2.4}
          viewBox="-60 -60 220 220"
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            overflow: "visible",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          {[[-1,-1],[1,-1],[1,1],[-1,1],[-1,0],[1,0],[0,-1],[0,1]].map(([dx,dy], i) => (
            <line
              key={i}
              x1={50 + dx * 68} y1={50 + dy * 68}
              x2={50 + dx * 82} y2={50 + dy * 82}
              stroke="white" strokeWidth="2.5" strokeLinecap="round"
              opacity="0.80"
              style={{
                animation: `gift-sparkle-line 0.7s ease-out ${i * 0.04}s both`,
              }}
            />
          ))}
        </svg>
      )}

      {/* ── SVG star character ── */}
      <svg
        width={size} height={size}
        viewBox="0 0 100 100"
        shapeRendering="crispEdges"
        style={{ position: "relative", zIndex: 1, overflow: "visible" }}
        aria-hidden
      >
        <defs>
          {/* Clip to star silhouette for all shading overlays */}
          <clipPath id="csc-clip">
            <polygon points={STAR_POINTS} />
          </clipPath>
          {/* Warm upper-left highlight gradient */}
          <radialGradient id="csc-hl" cx="40%" cy="32%" r="55%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="white" stopOpacity="0.62" />
            <stop offset="35%"  stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0"    />
          </radialGradient>
          {/* Subtle bottom-shadow gradient */}
          <linearGradient id="csc-sh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="50%" stopColor="#1a0c04" stopOpacity="0"    />
            <stop offset="100%" stopColor="#1a0c04" stopOpacity="0.22" />
          </linearGradient>
        </defs>

        {/* ── Star body — chunkier inner arms (r=26) for pixel-art puffiness ── */}
        <polygon
          points={STAR_POINTS}
          fill={color}
          stroke="#2d1400"
          strokeWidth="4.5"
          strokeLinejoin="miter"
          strokeLinecap="square"
          paintOrder="stroke"
        />

        {/* ── Pixel-art shading row — darker amber bottom strip (clipped) ── */}
        <rect x="0" y="55" width="100" height="50" fill="url(#csc-sh)" clipPath="url(#csc-clip)" />

        {/* ── Warm upper-left highlight gradient (clipped) ── */}
        <polygon points={STAR_POINTS} fill="url(#csc-hl)" stroke="none" />

        {/* ── Pixel-art highlight blocks — prominent white squares, top-left zone ── */}
        <g clipPath="url(#csc-clip)">
          {/* Large main highlight block */}
          <rect x="29" y="15" width="7"   height="7"   fill="white" opacity="0.70" />
          {/* Medium highlight */}
          <rect x="36" y="10" width="5"   height="5"   fill="white" opacity="0.50" />
          {/* Small accent */}
          <rect x="24" y="22" width="4"   height="4"   fill="white" opacity="0.35" />
          {/* Tiny sparkle */}
          <rect x="39" y="16" width="3"   height="3"   fill="white" opacity="0.25" />
          {/* Right arm mid-shine */}
          <rect x="72" y="38" width="4"   height="3"   fill="white" opacity="0.20" />
        </g>

        {/* ── Face ── */}

        {sleeping ? (

          /* Sleeping: wide soft dash-eyes, tiny mouth curve — "— —" */
          <g opacity="0.90">
            <rect x="33" y="48" width="13" height="3.5" rx="1.75" fill="#2d1400" />
            <rect x="54" y="48" width="13" height="3.5" rx="1.75" fill="#2d1400" />
            {/* Tiny sleeping blush circles */}
            <ellipse cx="34" cy="58" rx="5.5" ry="3.5" fill="#ff9aaa" opacity="0.40" />
            <ellipse cx="66" cy="58" rx="5.5" ry="3.5" fill="#ff9aaa" opacity="0.40" />
          </g>

        ) : (

          <g>
            {/* LEFT eye — big round sclera, springs open on wake */}
            <g style={waking ? { ...pivot, animation: "gift-eye-open 0.40s cubic-bezier(0.34,1.56,0.64,1) both" } : undefined}>
              {/* Sclera — taller oval */}
              <rect x="33" y="38" width="14" height="17" rx="7" fill="white" stroke="#2d1400" strokeWidth="1.8" />
              {/* Pupil */}
              <rect x="35.5" y="40.5" width="9" height="12" rx="3.5" fill="#2d1400" />
              {/* Star-shaped glint: cross of two white rects */}
              <rect x="40"   y="41.5" width="4"   height="1.5" fill="white" opacity="1" />
              <rect x="41"   y="40.5" width="2"   height="3.5" fill="white" opacity="1" />
              {/* Soft secondary glint (bottom-left of pupil) */}
              <rect x="36.5" y="49.5" width="2.5" height="2.5" fill="white" opacity="0.50" />
            </g>

            {/* RIGHT eye — springs open then gives a cute wink */}
            <g style={waking ? { ...pivot, animation: "gift-wink 1.1s ease-in-out both" } : undefined}>
              {/* Sclera */}
              <rect x="53" y="38" width="14" height="17" rx="7" fill="white" stroke="#2d1400" strokeWidth="1.8" />
              {/* Pupil */}
              <rect x="55.5" y="40.5" width="9" height="12" rx="3.5" fill="#2d1400" />
              {/* Star-shaped glint */}
              <rect x="60"   y="41.5" width="4"   height="1.5" fill="white" opacity="1" />
              <rect x="61"   y="40.5" width="2"   height="3.5" fill="white" opacity="1" />
              {/* Soft secondary glint */}
              <rect x="56.5" y="49.5" width="2.5" height="2.5" fill="white" opacity="0.50" />
            </g>

            {/* Tiny curved smile */}
            <path
              d="M 41,63 Q 50,69 59,63"
              fill="none" stroke="#2d1400"
              strokeWidth="2.6" strokeLinecap="round"
              shapeRendering="geometricPrecision"
            />

            {/* Soft round pink cheeks */}
            <ellipse cx="33" cy="60" rx="6.5" ry="4.5" fill="#ff88aa" opacity="0.50" />
            <ellipse cx="67" cy="60" rx="6.5" ry="4.5" fill="#ff88aa" opacity="0.50" />
          </g>

        )}
      </svg>
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
  phase: Exclude<OpenPhase, "card" | "revealed">;
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
      {/* ── Animated star character (hidden during burst) ── */}
      {phase !== "burst" && (
        // Anchor: reference point at the viewport centre
        <div style={{ position: "absolute", top: "50%", left: "50%" }}>
          {/* Centering: aligns the 120 × 120 character centre with the anchor */}
          <div style={{ transform: "translate(-50%, -50%)" }}>
            {/* Motion: animation translates/rotates from (0,0) = centred position */}
            <div style={{ animation: starAnimation }}>
              <CuteStarCharacter color={color} size={120} phase={phase} />
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

// ─── PixelTeaserCard — "You have a gift!" interstitial ───────────────────────
//
// Cute pixel-style parchment card that appears after the burst and before the
// full postcard reveals. Mimics the reference: decorative stitched border,
// heart stamp top-right, bunny bottom-left, bold centred text.

function PixelTeaserCard({
  toName,
  exiting,
}: {
  toName: string;
  exiting: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 340,
        animation: exiting
          ? "gift-card-exit 0.5s cubic-bezier(0.4,0,0.6,1) forwards"
          : "gift-card-reveal 0.65s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <article
        style={{
          background: "oklch(0.978 0.018 50)",   // warm parchment
          border: "3px solid oklch(0.82 0.06 50)",
          borderRadius: 20,
          position: "relative",
          overflow: "hidden",
          boxShadow: [
            "0 0 0 6px oklch(0.94 0.04 50)",      // outer parchment ring
            "0 0 0 7px oklch(0.78 0.07 50)",       // pixel border ring
            "0 12px 48px oklch(0.60 0.10 50 / 0.30)",
          ].join(", "),
          fontFamily: "inherit",
          padding: "28px 24px 22px",
          textAlign: "center",
        }}
      >
        {/* Stitched corner dots — pixel-art detail */}
        {["top-left","top-right","bottom-left","bottom-right"].map((c) => (
          <span
            key={c}
            aria-hidden
            style={{
              position: "absolute",
              ...(c.includes("top")    ? { top: 8 }    : { bottom: 8 }),
              ...(c.includes("left")  ? { left: 8 }   : { right: 8 }),
              width: 5, height: 5,
              borderRadius: 1,
              background: "oklch(0.72 0.08 50)",
            }}
          />
        ))}

        {/* Decorative border dashes — top and bottom rows */}
        <div aria-hidden style={{
          position: "absolute", top: 14, left: 20, right: 20,
          height: 1,
          background: "repeating-linear-gradient(90deg, oklch(0.75 0.07 50) 0px, oklch(0.75 0.07 50) 4px, transparent 4px, transparent 9px)",
        }} />
        <div aria-hidden style={{
          position: "absolute", bottom: 14, left: 20, right: 20,
          height: 1,
          background: "repeating-linear-gradient(90deg, oklch(0.75 0.07 50) 0px, oklch(0.75 0.07 50) 4px, transparent 4px, transparent 9px)",
        }} />

        {/* Heart stamp — top right */}
        <div aria-hidden style={{
          position: "absolute", top: 18, right: 18,
          width: 44, height: 50,
          border: "2px dashed oklch(0.72 0.08 50)",
          borderRadius: 4,
          background: "oklch(1 0 0 / 0.50)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 2,
          padding: "4px 3px 3px",
        }}>
          <span style={{ fontSize: 19, lineHeight: 1 }}>❤️</span>
          <div style={{
            width: 28, height: 1,
            background: "oklch(0.65 0.08 50 / 0.5)",
            marginTop: 3,
          }} />
        </div>

        {/* Main text */}
        <div style={{ marginTop: 12, marginBottom: 16 }}>
          <p style={{
            fontSize: 28, fontWeight: 800,
            lineHeight: 1.25,
            color: "oklch(0.28 0.08 342)",
            letterSpacing: "-0.01em",
            margin: "0 0 4px",
          }}>
            You have<br />a gift! ❤
          </p>
          {toName && (
            <p style={{
              fontSize: 13,
              color: "oklch(0.55 0.07 342)",
              margin: 0,
            }}>
              For&nbsp;<strong style={{ color: "oklch(0.35 0.09 342)" }}>{toName}</strong>
            </p>
          )}
        </div>

        {/* Bunny — bottom left */}
        <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 4 }}>
          <img
            src={bunnyHer}
            alt=""
            width={34} height={34}
            style={{ imageRendering: "pixelated", objectFit: "contain", opacity: 0.85 }}
          />
        </div>
      </article>
    </div>
  );
}

// ─── GiftPostcard — collectible cozy postcard reveal ─────────────────────────
//
// Pastel pink card with stamp, bunny icon, and elegant typography.
// Replaces the plain glass-card layout after the intro animation ends.

function GiftPostcard({
  gift,
  emotionMeta,
}: {
  gift: GiftStarPublic;
  emotionMeta: { emoji: string; label: string };
}) {
  // Pastel pink palette — independent of the gift star colour so the card
  // always reads as a precious keepsake rather than just a coloured panel.
  const cardBg    = "oklch(0.975 0.020 350)";
  const border    = "oklch(0.87  0.040 350)";
  const textDark  = "oklch(0.28  0.08  342)";
  const textMid   = "oklch(0.52  0.07  342)";
  const textLight = "oklch(0.70  0.05  342)";
  const gold      = "oklch(0.72  0.10   52)";

  return (
    <article
      style={{
        width: "100%",
        background: cardBg,
        border: `1.5px solid ${border}`,
        borderRadius: 22,
        boxShadow: [
          "0 2px 0 oklch(1 0 0 / 0.65) inset",   // top inner highlight
          `0 -1px 0 ${border} inset`,              // bottom inner edge
          "0 10px 48px oklch(0.72 0.08 345 / 0.18)",
          "0 2px 10px oklch(0.72 0.08 345 / 0.12)",
        ].join(", "),
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      {/* Thin decorative stripe at the very top — rose → warm gold → rose */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg,
          oklch(0.82 0.07 345),
          oklch(0.82 0.09 42),
          oklch(0.82 0.07 345))`,
      }} />

      {/* ── Header ── */}
      <header style={{ padding: "18px 20px 14px", position: "relative" }}>

        {/* Corner sparkle */}
        <span aria-hidden style={{
          position: "absolute", top: 13, left: 15,
          fontSize: 10, color: textLight, opacity: 0.7,
          lineHeight: 1,
        }}>✦</span>

        {/* Postage stamp — top-right corner */}
        <div aria-hidden style={{
          position: "absolute", top: 14, right: 16,
          width: 48, height: 56,
          border: `1.5px dashed ${gold}`,
          borderRadius: 4,
          background: "oklch(1 0 0 / 0.55)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 0,
          padding: "5px 4px 4px",
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>⭐</span>
          <div style={{
            width: 32, height: 1,
            background: `oklch(0.65 0.08 52 / 0.5)`,
            margin: "4px 0 3px",
          }} />
          <span style={{
            fontSize: 5.5, color: gold,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            lineHeight: 1,
          }}>GALAXY</span>
        </div>

        {/* Emotion badge */}
        <p style={{
          fontSize: 9, fontWeight: 700,
          letterSpacing: 2.2,
          textTransform: "uppercase",
          color: textLight,
          margin: "0 0 6px",
        }}>
          {emotionMeta.emoji}&ensp;{emotionMeta.label}
        </p>

        {/* Recipient name — large elegant heading */}
        <h2 style={{
          fontFamily: "var(--font-elegant, 'Georgia', serif)",
          fontSize: 25, fontWeight: 400,
          color: textDark, lineHeight: 1.25,
          paddingRight: 64, margin: "0 0 6px",
        }}>
          For {gift.to_name} ✨
        </h2>

        {/* Sender line */}
        <p style={{ fontSize: 12, color: textMid, margin: 0 }}>
          From&nbsp;<strong style={{ color: textDark }}>{gift.sender_name}</strong>
        </p>
      </header>

      {/* ── Decorative divider ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "0 20px", marginBottom: 14,
      }}>
        <div style={{ flex: 1, height: 1, background: border }} />
        <span aria-hidden style={{ color: textLight, fontSize: 11, lineHeight: 1 }}>✦</span>
        <div style={{ flex: 1, height: 1, background: border }} />
      </div>

      {/* ── Message ── */}
      <div style={{ padding: "0 24px 20px" }}>
        <p style={{
          fontFamily: "var(--font-elegant, 'Georgia', serif)",
          fontStyle: "italic",
          fontSize: 14, lineHeight: 1.80,
          color: textMid,
          whiteSpace: "pre-wrap",
          margin: 0,
        }}>
          &ldquo;{gift.message}&rdquo;
        </p>
      </div>

      {/* ── Lower rule ── */}
      <div style={{ height: 1, background: border, margin: "0 20px" }} />

      {/* ── Footer ── */}
      <footer style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 16px 13px",
      }}>
        {/* Bunny character — bottom-left corner */}
        <img
          src={bunnyHer}
          alt=""
          width={38} height={38}
          style={{ imageRendering: "pixelated", objectFit: "contain", opacity: 0.88 }}
        />

        {/* Footer text + link — right-aligned */}
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9.5, color: textLight, margin: "0 0 2px" }}>
            Sent with love via
          </p>
          <Link
            to="/"
            style={{
              fontSize: 11, color: textMid,
              fontWeight: 600, textDecoration: "none",
              display: "flex", alignItems: "center",
              gap: 4, justifyContent: "flex-end",
            }}
          >
            Our Little Galaxy&ensp;✦
          </Link>
        </div>
      </footer>
    </article>
  );
}

// ─── Open-gift view (owns the intro state machine) ────────────────────────────

function GiftOpenView({ gift, activeColor }: { gift: GiftStarPublic; activeColor: string }) {
  const emotionMeta = EMOTIONS.find((e) => e.key === gift.emotion) ?? EMOTIONS[0];
  const [phase, setPhase] = useState<OpenPhase>("intro");
  // cardExiting drives the exit animation of PixelTeaserCard before "revealed"
  const [cardExiting, setCardExiting] = useState(false);

  useEffect(() => {
    // Phase timeline:
    //    0 ms → "intro"    star appears (spring scale-up)
    //  700 ms → "wake"     star wakes & winks
    // 1800 ms → "arc"      star flies arc downward with sparkle trail
    // 3200 ms → "burst"    flash + particles at arc endpoint
    // 3550 ms → "card"     pixel teaser card: "You have a gift! ❤"
    // 5000 ms →            teaser card exits (slide-out)
    // 5500 ms → "revealed" actual gift postcard fades in
    const t1 = setTimeout(() => setPhase("wake"),         700);
    const t2 = setTimeout(() => setPhase("arc"),         1800);
    const t3 = setTimeout(() => setPhase("burst"),       3200);
    const t4 = setTimeout(() => setPhase("card"),        3550);
    const t5 = setTimeout(() => setCardExiting(true),    5000);
    const t6 = setTimeout(() => setPhase("revealed"),    5500);
    return () => [t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
  }, []);

  return (
    <Shell color={activeColor}>
      {/* Intro overlay — fixed on top during the animation phases */}
      {phase !== "card" && phase !== "revealed" && (
        <GiftIntroOverlay phase={phase} color={activeColor} />
      )}

      {/* Pixel teaser card — "You have a gift!" shown between burst and postcard */}
      {phase === "card" && (
        <PixelTeaserCard toName={gift.to_name} exiting={cardExiting} />
      )}

      {/* Gift postcard — hidden during the animation, fades in on reveal */}
      <div
        className="w-full"
        style={{
          opacity:       phase === "revealed" ? 1 : 0,
          animation:     phase === "revealed"
            ? "gift-content-reveal 0.9s cubic-bezier(0.22,1,0.36,1) both"
            : "none",
          pointerEvents: phase === "revealed" ? "auto" : "none",
        }}
      >
        <GiftPostcard gift={gift} emotionMeta={emotionMeta} />
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
