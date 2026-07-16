import { useEffect, useState } from "react";
import nightSky from "@/assets/night-sky.jpg";

type Mote = { top: number; left: number; size: number; delay: number; duration: number };

function makeMotes(): Mote[] {
  return Array.from({ length: 26 }).map(() => ({
    top: 18 + Math.random() * 72,
    left: 4 + Math.random() * 92,
    size: 1.4 + Math.random() * 2.2,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 12,
  }));
}

/**
 * Cozy Room — warm nighttime room background for the logged-in experience.
 * Layers: deep wall → night-sky window → curtain drapes → candlelight glow →
 *         moonlight spill → floating dust motes → dark floor → edge vignette.
 */
export function CozyRoom() {
  const [motes, setMotes] = useState<Mote[]>([]);

  useEffect(() => {
    setMotes(makeMotes());
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* ── Room wall: deep midnight blue-plum ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(175deg, oklch(0.13 0.05 272) 0%, oklch(0.14 0.04 265) 45%, oklch(0.16 0.05 258) 75%, oklch(0.13 0.04 248) 100%)",
        }}
      />

      {/* ── Warm candlelight rising from the floor ── */}
      <div
        className="animate-candle absolute inset-x-0 bottom-0 h-3/4"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 50% 115%, oklch(0.50 0.14 62 / 0.30), oklch(0.38 0.10 58 / 0.13) 38%, transparent 62%)",
        }}
      />

      {/* ── Left floor warmth ── */}
      <div
        className="absolute bottom-0 left-0 h-2/3 w-1/2"
        style={{
          background:
            "radial-gradient(ellipse at 0% 100%, oklch(0.42 0.10 60 / 0.16), transparent 55%)",
        }}
      />

      {/* ── Right floor warmth ── */}
      <div
        className="absolute bottom-0 right-0 h-2/3 w-1/2"
        style={{
          background:
            "radial-gradient(ellipse at 100% 100%, oklch(0.40 0.09 58 / 0.14), transparent 55%)",
        }}
      />

      {/* ══════════════ Night-sky window ══════════════ */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "4.5%",
          width: "clamp(240px, 36vw, 460px)",
          height: "clamp(130px, 22vh, 220px)",
        }}
      >
        {/* Sky photograph */}
        <img
          src={nightSky}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            borderRadius: "2px",
            filter: "brightness(0.58) saturate(1.25) hue-rotate(-8deg)",
          }}
        />

        {/* Inner atmospheric glow (moon + sky tint) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 32% 28%, oklch(0.88 0.06 90 / 0.20), transparent 52%), radial-gradient(ellipse at 72% 18%, oklch(0.72 0.07 238 / 0.18), transparent 48%)",
          }}
        />

        {/* Window pane — vertical divider */}
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px]"
          style={{ background: "oklch(0.36 0.08 52 / 0.85)" }}
        />
        {/* Window pane — horizontal divider */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px]"
          style={{ background: "oklch(0.36 0.08 52 / 0.85)" }}
        />

        {/* Window frame */}
        <div
          className="absolute -inset-[6px]"
          style={{
            border: "6px solid oklch(0.33 0.08 50)",
            borderRadius: "4px",
            boxShadow:
              "inset 0 0 28px oklch(0.09 0.03 255 / 0.75), 0 0 70px oklch(0.68 0.08 238 / 0.10), -6px 0 18px oklch(0.09 0.03 260 / 0.35), 6px 0 18px oklch(0.09 0.03 260 / 0.35)",
          }}
        />

        {/* Moonlight spill onto wall below window */}
        <div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2"
          style={{
            width: "170%",
            height: "110px",
            background:
              "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.07 238 / 0.11), transparent 65%)",
            filter: "blur(14px)",
          }}
        />
      </div>
      {/* ══════════════════════════════════════════════ */}

      {/* ── Left curtain drape ── */}
      <div
        className="absolute bottom-0 top-0"
        style={{
          left: 0,
          width: "clamp(55px, 9vw, 130px)",
          background:
            "linear-gradient(90deg, oklch(0.21 0.05 342 / 0.95) 0%, oklch(0.20 0.05 338 / 0.55) 55%, transparent 100%)",
        }}
      />

      {/* ── Right curtain drape ── */}
      <div
        className="absolute bottom-0 top-0"
        style={{
          right: 0,
          width: "clamp(55px, 9vw, 130px)",
          background:
            "linear-gradient(270deg, oklch(0.21 0.05 342 / 0.95) 0%, oklch(0.20 0.05 338 / 0.55) 55%, transparent 100%)",
        }}
      />

      {/* ── Floating dust motes ── */}
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-mote"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            width: m.size,
            height: m.size,
            background: "oklch(0.90 0.08 70 / 0.72)",
            boxShadow: `0 0 ${Math.round(m.size * 3)}px oklch(0.88 0.10 70 / 0.58)`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        />
      ))}

      {/* ── Dark floor plane ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-[18%]"
        style={{
          background:
            "linear-gradient(to top, oklch(0.09 0.03 42) 0%, oklch(0.11 0.03 42 / 0.55) 50%, transparent 100%)",
        }}
      />

      {/* ── Edge vignette to close the room walls ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 48%, oklch(0.08 0.03 255 / 0.58) 100%)",
        }}
      />
    </div>
  );
}
