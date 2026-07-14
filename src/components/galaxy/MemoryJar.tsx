import { useMemo } from "react";
import jarImg from "@/assets/memory-jar.png";

interface Props {
  size?: number;
  className?: string;
}

/** 3D-looking glowing glass jar with animated colorful stars floating inside. */
export function MemoryJar({ size = 420, className = "" }: Props) {
  const innerStars = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        top: 25 + Math.random() * 55,
        left: 20 + Math.random() * 60,
        size: 8 + Math.random() * 14,
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 4,
        color: [
          "oklch(0.9 0.15 90)",
          "oklch(0.85 0.12 20)",
          "oklch(0.85 0.1 240)",
          "oklch(0.87 0.11 160)",
          "oklch(0.88 0.13 320)",
        ][i % 5],
      })),
    [],
  );

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size * 1.22 }}>
      {/* Outer glow halo */}
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse-glow"
        style={{
          background: "radial-gradient(circle at 50% 60%, oklch(0.9 0.15 90 / 0.55), transparent 60%)",
        }}
      />

      {/* Floating jar */}
      <div className="relative h-full w-full animate-float-jar">
        <img
          src={jarImg}
          alt="Glass jar of memories"
          className="h-full w-full object-contain drop-shadow-[0_20px_60px_oklch(0.9_0.15_90_/_0.35)]"
        />

        {/* Overlay: bonus twinkling stars inside jar */}
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
                filter: `drop-shadow(0 0 8px ${s.color})`,
              }}
            >
              <svg viewBox="0 0 24 24" fill={s.color} className="h-full w-full opacity-80">
                <path d="M12 2l2.9 6.6L22 9.7l-5.2 4.7L18.2 22 12 18.3 5.8 22l1.4-7.6L2 9.7l7.1-1.1L12 2z" />
              </svg>
            </span>
          ))}
        </div>

        {/* Escaping light */}
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-32 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 animate-twinkle"
          style={{
            background: "radial-gradient(circle, oklch(0.95 0.14 90 / 0.7), transparent 70%)",
            filter: "blur(14px)",
          }}
        />
      </div>
    </div>
  );
}
