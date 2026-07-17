import { useMemo } from "react";
import jarImg from "@/assets/memory-jar-pixel.png";

interface Props {
  size?: number;
  className?: string;
  /**
   * 0 = empty jar … 4 = fully alive (12+ stars).
   * Drives the progressive glow intensity. Defaults to 0.
   */
  glowLevel?: number;
}

// ── Glow intensity table per tier (0–4) ───────────────────────────────────────
// Each row: halo/shadow opacities that scale up as the jar fills with memories.
const GLOW = [
  // 0 — empty
  { h1i: 0.48, h1o: 0.22, h2: 0.28, h3: 0.18, s1a: 0.45, s1px: 48, s2a: 0.28, s3a: 0.30, cork: 0.65 },
  // 1 — 1–3 stars
  { h1i: 0.53, h1o: 0.26, h2: 0.33, h3: 0.22, s1a: 0.52, s1px: 53, s2a: 0.33, s3a: 0.36, cork: 0.72 },
  // 2 — 4–7 stars
  { h1i: 0.59, h1o: 0.31, h2: 0.39, h3: 0.26, s1a: 0.60, s1px: 59, s2a: 0.39, s3a: 0.43, cork: 0.80 },
  // 3 — 8–11 stars
  { h1i: 0.67, h1o: 0.37, h2: 0.46, h3: 0.31, s1a: 0.69, s1px: 66, s2a: 0.46, s3a: 0.50, cork: 0.88 },
  // 4 — 12+ stars
  { h1i: 0.78, h1o: 0.44, h2: 0.55, h3: 0.38, s1a: 0.80, s1px: 75, s2a: 0.55, s3a: 0.60, cork: 1.00 },
] as const;

/** Pixel-art magical glass jar with animated pastel memory stars floating inside. */
export function MemoryJar({ size = 420, className = "", glowLevel = 0 }: Props) {
  const g = GLOW[Math.min(Math.max(Math.round(glowLevel), 0), 4)];

  const innerStars = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        top: 30 + Math.random() * 45,
        left: 22 + Math.random() * 56,
        size: 6 + Math.random() * 10,
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 4,
        color: [
          "oklch(0.92 0.16 90)",   /* warm gold  */
          "oklch(0.88 0.13 350)",  /* soft pink  */
          "oklch(0.85 0.10 240)",  /* sky blue   */
          "oklch(0.87 0.11 290)",  /* lavender   */
          "oklch(0.88 0.12 160)",  /* mint green */
        ][i % 5],
      })),
    [],
  );

  // Pool opacity scales with glow level (subtle at low levels)
  const poolA  = (g.h2  * 0.65).toFixed(2);
  const poolA2 = (g.h3  * 0.50).toFixed(2);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size * 1.22 }}>

      {/* ── Outer lavender-blue glow halo ── */}
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse-glow"
        style={{
          background:
            `radial-gradient(circle at 50% 62%, oklch(0.80 0.14 280 / ${g.h1i}), oklch(0.82 0.10 320 / ${g.h1o}) 45%, transparent 68%)`,
        }}
      />

      {/* ── Warm golden core (star energy inside the glass) ── */}
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse-glow"
        style={{
          animationDelay: "1.4s",
          background:
            `radial-gradient(circle at 50% 68%, oklch(0.92 0.16 90 / ${g.h2}), transparent 52%)`,
        }}
      />

      {/* ── Soft pink accent bloom ── */}
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse-glow"
        style={{
          animationDelay: "2.8s",
          background:
            `radial-gradient(ellipse at 60% 55%, oklch(0.88 0.13 350 / ${g.h3}), transparent 55%)`,
        }}
      />

      {/* ── Floating jar sprite ── */}
      <div className="relative h-full w-full animate-float-jar">
        {/* Breathing wrapper — very subtle inhale/exhale layered on top of the float */}
        <div className="relative h-full w-full animate-jar-breathe">
          <img
            src={jarImg}
            alt="Glass jar of memories"
            className="h-full w-full object-contain"
            style={{
              imageRendering: "pixelated",
              filter: [
                `drop-shadow(0 16px ${g.s1px}px oklch(0.80 0.14 280 / ${g.s1a}))`,
                `drop-shadow(0 0 28px oklch(0.88 0.13 350 / ${g.s2a}))`,
                `drop-shadow(0 0 14px oklch(0.92 0.16 90 / ${g.s3a}))`,
              ].join(" "),
            }}
          />

          {/* ── Twinkling pixel star sparkles floating inside ── */}
          <div className="pointer-events-none absolute inset-0">
            {innerStars.map((s, i) => (
              <span
                key={i}
                className="absolute animate-float-star"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: s.size,
                  height: s.size,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.duration}s`,
                  filter: `drop-shadow(0 0 6px ${s.color})`,
                }}
              >
                <svg viewBox="0 0 24 24" fill={s.color} className="h-full w-full opacity-75">
                  <path d="M12 2l2.9 6.6L22 9.7l-5.2 4.7L18.2 22 12 18.3 5.8 22l1.4-7.6L2 9.7l7.1-1.1L12 2z" />
                </svg>
              </span>
            ))}
          </div>

          {/* ── Magical energy escaping from the cork top ── */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 h-28 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full animate-twinkle"
            style={{
              opacity: g.cork,
              background:
                "radial-gradient(circle, oklch(0.92 0.16 90 / 0.70), oklch(0.85 0.12 320 / 0.40) 40%, transparent 70%)",
              filter: "blur(12px)",
            }}
          />

          {/* ── Glass atmosphere — primary reflection: upper-left streak ── */}
          <div
            aria-hidden
            className="pointer-events-none absolute animate-twinkle"
            style={{
              top: "18%",
              left: "17%",
              width: "11%",
              height: "33%",
              background:
                "linear-gradient(155deg, oklch(1 0 0 / 0.55), oklch(0.94 0.04 280 / 0.20) 55%, transparent)",
              borderRadius: "40% 60% 60% 40% / 30% 30% 70% 70%",
              filter: "blur(2px)",
              animationDelay: "0.8s",
            }}
          />

          {/* ── Glass atmosphere — secondary reflection: upper-right glint ── */}
          <div
            aria-hidden
            className="pointer-events-none absolute animate-twinkle"
            style={{
              top: "24%",
              right: "16%",
              width: "6%",
              height: "18%",
              background:
                "linear-gradient(210deg, oklch(1 0 0 / 0.28), oklch(0.90 0.05 280 / 0.10) 55%, transparent)",
              borderRadius: "50% 40% 40% 50% / 40% 40% 60% 60%",
              filter: "blur(1.5px)",
              animationDelay: "1.9s",
            }}
          />

          {/* ── Glass atmosphere — inner starlight pool at jar base ── */}
          {/* Warm collected light that grows subtly with glowLevel */}
          <div
            aria-hidden
            className="pointer-events-none absolute animate-pulse-glow"
            style={{
              bottom: "11%",
              left: "22%",
              right: "22%",
              height: "20%",
              background:
                `radial-gradient(ellipse at 50% 75%, oklch(0.92 0.15 82 / ${poolA}), oklch(0.87 0.12 320 / ${poolA2}) 55%, transparent 80%)`,
              filter: "blur(9px)",
              animationDelay: "2.1s",
            }}
          />
        </div>
      </div>
    </div>
  );
}
