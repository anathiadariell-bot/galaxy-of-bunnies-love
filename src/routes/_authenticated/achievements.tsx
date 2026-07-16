import { createFileRoute } from "@tanstack/react-router";
import { Lock, Trophy, Sparkles, Mail, CalendarHeart, Flame } from "lucide-react";
import { PageShell } from "@/components/galaxy/PageShell";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { GlassCard } from "@/components/galaxy/GlassCard";
import { useLetters, useProfile, useStars } from "@/hooks/useGalaxyData";
import { daysBetween } from "@/lib/galaxy";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Our Little Galaxy" },
      { name: "description", content: "Little milestones that light up your galaxy." },
    ],
  }),
  component: AchievementsPage,
});

interface Badge {
  key: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  icon: React.ComponentType<{ className?: string }>;
}

function AchievementsPage() {
  const { data: stars = [] } = useStars();
  const { data: letters = [] } = useLetters();
  const { data: profile } = useProfile();
  const days = daysBetween(profile?.together_since);
  const uniqueEmotions = new Set(stars.map((s) => s.emotion)).size;

  const badges: Badge[] = [
    { key: "first-star", title: "First Star", description: "Place your first memory.", progress: Math.min(stars.length, 1), goal: 1, icon: Sparkles },
    { key: "ten-stars", title: "A Small Cluster", description: "Ten stars in your jar.", progress: Math.min(stars.length, 10), goal: 10, icon: Sparkles },
    { key: "fifty-stars", title: "Constellation", description: "Fifty stars strong.", progress: Math.min(stars.length, 50), goal: 50, icon: Trophy },
    { key: "first-letter", title: "Love Letter", description: "Seal your first letter.", progress: Math.min(letters.length, 1), goal: 1, icon: Mail },
    { key: "five-letters", title: "Chapter One", description: "Five letters written.", progress: Math.min(letters.length, 5), goal: 5, icon: Mail },
    { key: "hundred-days", title: "One Hundred Days", description: "A gentle century together.", progress: Math.min(days, 100), goal: 100, icon: CalendarHeart },
    { key: "year", title: "A Whole Year", description: "365 days around the sun.", progress: Math.min(days, 365), goal: 365, icon: Flame },
    { key: "all-feelings", title: "Every Feeling", description: "Use every emotion at least once.", progress: uniqueEmotions, goal: 6, icon: Sparkles },
  ];

  return (
    <>
      <ThemeBoot />
      <PageShell
        eyebrow="Achievements"
        title="Little constellations"
        subtitle="Milestones your galaxy has quietly celebrated."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b, i) => {
            const unlocked = b.progress >= b.goal;
            const Icon = b.icon;
            const pct = Math.round((b.progress / b.goal) * 100);
            return (
              <GlassCard
                key={b.key}
                delay={i * 0.05}
                className={`relative overflow-hidden ${unlocked ? "animate-badge-glow" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      unlocked ? "bg-primary/25 text-primary" : "bg-white/6 text-foreground/50"
                    }`}
                  >
                    {unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className={`font-display text-2xl ${unlocked ? "text-primary text-glow" : "text-foreground/70"}`}>
                      {b.title}
                    </p>
                    <p className="font-elegant text-sm text-foreground/60">{b.description}</p>
                  </div>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: unlocked ? "var(--gradient-primary)" : "oklch(1 0 0 / 0.35)",
                    }}
                  />
                </div>
                <p className="font-elegant mt-2 text-sm text-foreground/60">
                  {unlocked ? "Unlocked ✦" : `${b.progress} / ${b.goal}`}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </PageShell>
    </>
  );
}
