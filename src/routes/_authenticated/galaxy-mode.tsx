import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { NightSky } from "@/components/galaxy/NightSky";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { X, Sparkles } from "lucide-react";
import { useStars } from "@/hooks/useGalaxyData";
import { STAR_COLORS, type StarColor } from "@/lib/galaxy";

export const Route = createFileRoute("/_authenticated/galaxy-mode")({
  head: () => ({
    meta: [
      { title: "Galaxy Mode — Our Little Galaxy" },
      { name: "description", content: "Fullscreen constellation of every memory you've placed." },
    ],
  }),
  component: GalaxyModePage,
});

function GalaxyModePage() {
  const navigate = useNavigate();
  const { data: stars = [] } = useStars();
  const [hover, setHover] = useState<string | null>(null);

  const positions = useMemo(
    () =>
      stars.map((s) => ({
        id: s.id,
        top: 8 + Math.random() * 78,
        left: 6 + Math.random() * 86,
        size: 10 + Math.random() * 18,
        delay: Math.random() * 6,
        color: STAR_COLORS[s.color as StarColor] ?? STAR_COLORS.gold,
      })),
    [stars],
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeBoot />
      <NightSky />

      <button
        onClick={() => navigate({ to: "/dashboard" })}
        aria-label="Exit galaxy mode"
        className="fixed right-5 top-5 z-40 glass flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pointer-events-none fixed left-1/2 top-6 z-30 -translate-x-1/2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/80">Galaxy Mode</p>
        <h1 className="font-display text-4xl text-primary text-glow">{stars.length} stars</h1>
      </div>

      <div className="relative z-10 h-screen w-screen">
        {positions.map((p) => {
          const s = stars.find((x) => x.id === p.id)!;
          const isHover = hover === p.id;
          return (
            <button
              key={p.id}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
              onFocus={() => setHover(p.id)}
              onBlur={() => setHover((h) => (h === p.id ? null : h))}
              className="animate-parallax-drift absolute cursor-pointer"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
              }}
            >
              <span
                className="block rounded-full animate-twinkle"
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 1.6}px ${p.color}`,
                  transform: isHover ? "scale(1.6)" : undefined,
                  transition: "transform 200ms ease",
                }}
              />
              {isHover && (
                <div className="glass-strong pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-56 -translate-x-1/2 rounded-2xl p-3 text-left animate-reveal">
                  <p className="font-display text-lg text-primary text-glow truncate">{s.title}</p>
                  {s.note && <p className="mt-1 line-clamp-2 text-xs text-foreground/80">{s.note}</p>}
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-foreground/60">
                    {new Date(s.starred_on).toLocaleDateString()}
                  </p>
                </div>
              )}
            </button>
          );
        })}

        {stars.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="glass rounded-3xl p-8 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-2 font-display text-2xl text-primary text-glow">A sky waiting for stars</p>
              <p className="mt-1 text-sm text-foreground/70">Add your first memory to see it here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
