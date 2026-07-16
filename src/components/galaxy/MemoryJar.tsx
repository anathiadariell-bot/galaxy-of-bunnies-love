import { useMemo } from "react";
import jarImg from "@/assets/memory-jar-pixel.png";

interface Props {
  size?: number;
  className?: string;
}

/** Pixel-art magical glass jar with animated pastel memory stars floating inside. */
export function MemoryJar({ size = 420, className = "" }: Props) {
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

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size * 1.22 }}>

      {/* ── Outer lavender-blue glow halo ── */}
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse-glow"
        style={{
          background:
            "radial-gradient(circle at 50% 62%, oklch(0.80 0.14 280 / 0.48), oklch(0.82 0.10 320 / 0.22) 45%, transparent 68%)",
        }}
      />

      {/* ── Warm golden core (star energy inside the glass) ── */}
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse-glow"
        style={{
          animationDelay: "1.4s",
          background:
            "radial-gradient(circle at 50% 68%, oklch(0.92 0.16 90 / 0.28), transparent 52%)",
        }}
      />

      {/* ── Soft pink accent bloom ── */}
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse-glow"
        style={{
          animationDelay: "2.8s",
          background:
            "radial-gradient(ellipse at 60% 55%, oklch(0.88 0.13 350 / 0.18), transparent 55%)",
        }}
      />

      {/* ── Floating jar sprite ── */}
      <div className="relative h-full w-full animate-float-jar">
        <img
          src={jarImg}
          alt="Glass jar of memories"
          className="h-full w-full object-contain"
          style={{
            imageRendering: "pixelated",
            filter: [
              /* blue-lavender halo matching the glass */
              "drop-shadow(0 16px 48px oklch(0.80 0.14 280 / 0.45))",
              /* soft pink rim glow */
              "drop-shadow(0 0 28px oklch(0.88 0.13 350 / 0.28))",
              /* warm golden sparkle core */
              "drop-shadow(0 0 14px oklch(0.92 0.16 90 / 0.30))",
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
            opacity: 0.65,
            background:
              "radial-gradient(circle, oklch(0.92 0.16 90 / 0.70), oklch(0.85 0.12 320 / 0.40) 40%, transparent 70%)",
            filter: "blur(12px)",
          }}
        />

        {/* ── Glass reflection shimmer — white streak on upper-left face ── */}
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
      </div>
    </div>
  );
}
