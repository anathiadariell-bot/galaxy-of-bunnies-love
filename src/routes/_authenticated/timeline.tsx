import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Mail } from "lucide-react";
import { PageShell } from "@/components/galaxy/PageShell";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { EmptyState } from "@/components/galaxy/EmptyState";
import { useLetters, useStars } from "@/hooks/useGalaxyData";
import { STAR_COLORS, type StarColor } from "@/lib/galaxy";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Our Little Galaxy" },
      { name: "description", content: "Your constellation of moments, in order." },
    ],
  }),
  component: TimelinePage,
});

type Event =
  | { kind: "star"; id: string; title: string; note: string | null; color: string; date: string }
  | { kind: "letter"; id: string; title: string; body: string; date: string };

function TimelinePage() {
  const { data: stars = [] } = useStars();
  const { data: letters = [] } = useLetters();

  const events: Event[] = [
    ...stars.map((s) => ({
      kind: "star" as const, id: s.id, title: s.title, note: s.note, color: s.color, date: s.starred_on,
    })),
    ...letters.map((l) => ({
      kind: "letter" as const, id: l.id, title: l.title, body: l.body, date: l.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <ThemeBoot />
      <PageShell
        eyebrow="Timeline"
        title="Our constellation"
        subtitle="Every star and letter, threaded together in time."
      >
        {events.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="No moments yet"
            description="Add a star or write a letter to begin your constellation."
            ctaLabel="Add your first star"
            ctaTo="/add-star"
          />
        ) : (
          <div className="relative mx-auto max-w-3xl">
            {/* thread */}
            <div
              aria-hidden
              className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px opacity-60"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, oklch(0.9 0.13 90 / 0.7) 10%, oklch(0.85 0.1 240 / 0.5) 50%, oklch(0.87 0.05 20 / 0.4) 90%, transparent)",
              }}
            />
            <ul className="space-y-8">
              {events.map((ev, i) => {
                const side = i % 2 === 0 ? "left" : "right";
                const color = ev.kind === "star" ? STAR_COLORS[ev.color as StarColor] ?? STAR_COLORS.gold : STAR_COLORS.blush;
                return (
                  <li key={`${ev.kind}-${ev.id}`} className="relative flex items-start">
                    {/* dot */}
                    <span
                      className="absolute left-1/2 top-4 -translate-x-1/2 h-4 w-4 rounded-full ring-4 ring-background"
                      style={{ background: color, boxShadow: `0 0 24px ${color}` }}
                    />
                    <div
                      className={`glass animate-reveal w-[calc(50%-1.5rem)] rounded-3xl p-5 ${
                        side === "left" ? "mr-auto text-left" : "ml-auto text-left"
                      }`}
                      style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}
                    >
                      <div className="font-elegant flex items-center gap-2 text-sm text-foreground/60">
                        {ev.kind === "star" ? <Sparkles className="h-3 w-3 not-italic" /> : <Mail className="h-3 w-3 not-italic" />}
                        <span>{new Date(ev.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                      </div>
                      <h3 className="mt-1 font-display text-2xl text-primary text-glow">{ev.title}</h3>
                      {ev.kind === "star" && ev.note && (
                        <p className="font-elegant mt-2 text-base text-foreground/80">{ev.note}</p>
                      )}
                      {ev.kind === "letter" && (
                        <p className="font-elegant mt-2 line-clamp-3 text-base text-foreground/75">{ev.body}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </PageShell>
    </>
  );
}
