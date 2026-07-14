import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Plus } from "lucide-react";
import { PageShell } from "@/components/galaxy/PageShell";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { MemoryJar } from "@/components/galaxy/MemoryJar";
import { EmptyState } from "@/components/galaxy/EmptyState";
import { useStars } from "@/hooks/useGalaxyData";
import { STAR_COLORS, type StarColor, EMOTIONS } from "@/lib/galaxy";

export const Route = createFileRoute("/_authenticated/my-jar")({
  head: () => ({
    meta: [
      { title: "My Jar — Our Little Galaxy" },
      { name: "description", content: "All your memories, gathered as glowing stars in one jar." },
    ],
  }),
  component: MyJarPage,
});

function MyJarPage() {
  const { data: stars = [], isLoading } = useStars();

  return (
    <>
      <ThemeBoot />
      <PageShell
        eyebrow="My Jar"
        title="Every star, kept safe"
        subtitle="A quiet place for the moments you never want to forget."
        actions={
          <Link
            to="/add-star"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground hover:scale-105 transition"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" /> Add Star
          </Link>
        }
      >
        <div className="mb-10 flex justify-center animate-reveal">
          <MemoryJar size={300} />
        </div>

        {isLoading ? (
          <div className="text-center text-foreground/60">Loading your stars…</div>
        ) : stars.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="Your jar is waiting"
            description="Add your first memory and watch it turn into a star."
            ctaLabel="Add your first star"
            ctaTo="/add-star"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stars.map((s, i) => {
              const color = STAR_COLORS[s.color as StarColor] ?? STAR_COLORS.gold;
              const emotion = EMOTIONS.find((e) => e.key === s.emotion);
              return (
                <div
                  key={s.id}
                  className="glass animate-reveal rounded-3xl p-6 transition hover:scale-[1.02] hover:bg-white/10"
                  style={{ animationDelay: `${Math.min(i, 12) * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ background: `${color} / 0.18`, color, boxShadow: `0 0 24px ${color} / 0.35` }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-foreground/60">
                      {new Date(s.starred_on).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-2xl text-primary text-glow">{s.title}</h3>
                  {s.note && <p className="mt-2 text-sm text-foreground/80">{s.note}</p>}
                  {emotion && (
                    <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-xs text-foreground/80">
                      <span>{emotion.emoji}</span> {emotion.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageShell>
    </>
  );
}
