import { useMemo } from "react";
import nightSky from "@/assets/night-sky.jpg";

/** Cinematic animated night sky background: gradient + image + twinkling stars + shooting stars + fireflies + drifting clouds. */
export function NightSky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }).map((_, i) => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2.2 + 0.6,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 3,
      })),
    [],
  );

  const fireflies = useMemo(
    () =>
      Array.from({ length: 14 }).map(() => ({
        top: 40 + Math.random() * 55,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 6 + Math.random() * 6,
        size: 3 + Math.random() * 3,
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-galaxy)" }} />

      {/* Painterly backdrop */}
      <img
        src={nightSky}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen animate-drift-slow"
      />

      {/* Soft cloud drift overlay */}
      <div
        className="absolute inset-0 opacity-40 animate-drift"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, oklch(0.9 0.05 320 / 0.35), transparent 55%), radial-gradient(ellipse at 80% 20%, oklch(0.87 0.05 20 / 0.3), transparent 55%), radial-gradient(ellipse at 60% 80%, oklch(0.9 0.05 240 / 0.25), transparent 60%)",
        }}
      />

      {/* Twinkling stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow: "0 0 6px rgba(255,255,255,0.9)",
          }}
        />
      ))}

      {/* Shooting stars */}
      <span
        className="absolute left-0 top-[18%] h-[2px] w-40 rounded-full animate-shooting-star"
        style={{
          background: "linear-gradient(90deg, transparent, #fff, transparent)",
          boxShadow: "0 0 12px #fff",
          animationDelay: "1.5s",
        }}
      />
      <span
        className="absolute left-0 top-[35%] h-[2px] w-32 rounded-full animate-shooting-star"
        style={{
          background: "linear-gradient(90deg, transparent, #ffe4b5, transparent)",
          boxShadow: "0 0 10px #ffe4b5",
          animationDelay: "4s",
          animationDuration: "8s",
        }}
      />

      {/* Fireflies */}
      {fireflies.map((f, i) => (
        <span
          key={`f-${i}`}
          className="absolute rounded-full animate-firefly"
          style={{
            top: `${f.top}%`,
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            background: "oklch(0.95 0.15 90)",
            boxShadow: "0 0 12px oklch(0.9 0.18 90 / 0.9), 0 0 24px oklch(0.9 0.18 90 / 0.5)",
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        />
      ))}

      {/* Bottom reflection glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, oklch(0.22 0.07 295 / 0.7), transparent)" }}
      />
    </div>
  );
}
