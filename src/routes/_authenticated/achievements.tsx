import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Trophy, Sparkles, Mail, CalendarHeart, Flame, Check } from "lucide-react";
import { PageShell } from "@/components/galaxy/PageShell";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { GlassCard } from "@/components/galaxy/GlassCard";
import { useAuthUser, useLetters, useProfile, useStars } from "@/hooks/useGalaxyData";
import {
  getAchievementProgressPercent,
  getAchievementStorageKey,
  parseStoredAchievementKeys,
  reconcileAchievementUnlocks,
  shouldPlayAchievementUnlockCelebration,
} from "@/lib/achievement-unlocks";
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

interface StoredUnlocks {
  userId: string;
  keys: string[] | null;
}

function AchievementsPage() {
  const user = useAuthUser();
  const starsQuery = useStars();
  const lettersQuery = useLetters();
  const profileQuery = useProfile();
  const { data: stars = [] } = starsQuery;
  const { data: letters = [] } = lettersQuery;
  const { data: profile } = profileQuery;
  const [storedUnlocks, setStoredUnlocks] = useState<StoredUnlocks | null>(null);
  const storedUnlocksRef = useRef<StoredUnlocks | null>(null);
  const [newlyUnlockedKeys, setNewlyUnlockedKeys] = useState<string[]>([]);
  const [reducedMotion, setReducedMotion] = useState(true);
  const days = daysBetween(profile?.together_since);
  const uniqueEmotions = new Set(stars.map((s) => s.emotion)).size;

  const badges = useMemo<Badge[]>(
    () => [
      {
        key: "first-star",
        title: "First Star",
        description: "Place your first memory.",
        progress: Math.min(stars.length, 1),
        goal: 1,
        icon: Sparkles,
      },
      {
        key: "ten-stars",
        title: "A Small Cluster",
        description: "Ten stars in your jar.",
        progress: Math.min(stars.length, 10),
        goal: 10,
        icon: Sparkles,
      },
      {
        key: "fifty-stars",
        title: "Constellation",
        description: "Fifty stars strong.",
        progress: Math.min(stars.length, 50),
        goal: 50,
        icon: Trophy,
      },
      {
        key: "first-letter",
        title: "Love Letter",
        description: "Seal your first letter.",
        progress: Math.min(letters.length, 1),
        goal: 1,
        icon: Mail,
      },
      {
        key: "five-letters",
        title: "Chapter One",
        description: "Five letters written.",
        progress: Math.min(letters.length, 5),
        goal: 5,
        icon: Mail,
      },
      {
        key: "hundred-days",
        title: "One Hundred Days",
        description: "A gentle century together.",
        progress: Math.min(days, 100),
        goal: 100,
        icon: CalendarHeart,
      },
      {
        key: "year",
        title: "A Whole Year",
        description: "365 days around the sun.",
        progress: Math.min(days, 365),
        goal: 365,
        icon: Flame,
      },
      {
        key: "all-feelings",
        title: "Every Feeling",
        description: "Use every emotion at least once.",
        progress: uniqueEmotions,
        goal: 6,
        icon: Sparkles,
      },
    ],
    [stars.length, letters.length, days, uniqueEmotions],
  );

  const dataReady = starsQuery.isSuccess && lettersQuery.isSuccess && profileQuery.isSuccess;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => {
      let appPreference = false;
      try {
        appPreference = window.localStorage.getItem("olg-reduced-motion") === "1";
      } catch {
        // The OS preference still applies if local storage is unavailable.
      }
      setReducedMotion(appPreference || media.matches);
    };

    syncReducedMotion();
    media.addEventListener("change", syncReducedMotion);
    window.addEventListener("storage", syncReducedMotion);
    return () => {
      media.removeEventListener("change", syncReducedMotion);
      window.removeEventListener("storage", syncReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      storedUnlocksRef.current = null;
      setStoredUnlocks(null);
      setNewlyUnlockedKeys([]);
      return;
    }
    if (storedUnlocksRef.current?.userId === user.id) return;

    let keys: string[] | null = null;
    try {
      keys = parseStoredAchievementKeys(
        window.localStorage.getItem(getAchievementStorageKey(user.id)),
      );
    } catch {
      // Progress-based unlocks still display if the browser blocks local storage.
    }

    const next = { userId: user.id, keys };
    storedUnlocksRef.current = next;
    setStoredUnlocks(next);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !dataReady) return;
    const current = storedUnlocksRef.current;
    if (!current || current.userId !== user.id) return;

    const result = reconcileAchievementUnlocks(badges, current.keys);
    const keysUnchanged =
      current.keys !== null &&
      current.keys.length === result.unlockedKeys.length &&
      current.keys.every((key) => result.unlockedKeys.includes(key));

    if (!keysUnchanged) {
      const next = { userId: user.id, keys: result.unlockedKeys };
      storedUnlocksRef.current = next;
      setStoredUnlocks(next);
      try {
        window.localStorage.setItem(
          getAchievementStorageKey(user.id),
          JSON.stringify(result.unlockedKeys),
        );
      } catch {
        // Keep this session's unlock state even if persistent storage is unavailable.
      }
    }

    if (result.newlyUnlockedKeys.length > 0) {
      setNewlyUnlockedKeys(result.newlyUnlockedKeys);
    }
  }, [user?.id, dataReady, badges]);

  useEffect(() => {
    if (newlyUnlockedKeys.length === 0) return;
    const timeout = window.setTimeout(() => setNewlyUnlockedKeys([]), 1200);
    return () => window.clearTimeout(timeout);
  }, [newlyUnlockedKeys]);

  useEffect(() => {
    if (reducedMotion) setNewlyUnlockedKeys([]);
  }, [reducedMotion]);

  const storedKeysForUser = user && storedUnlocks?.userId === user.id ? storedUnlocks.keys : null;
  const savedKeys = new Set(storedKeysForUser ?? []);

  return (
    <>
      <ThemeBoot />
      <PageShell
        eyebrow="Achievements"
        title="Little constellations"
        subtitle="Milestones your galaxy has quietly celebrated."
      >
        <div
          className={`achievement-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${
            reducedMotion ? "achievement-grid-reduced-motion" : ""
          }`}
        >
          {badges.map((b, i) => {
            const unlocked = b.progress >= b.goal || savedKeys.has(b.key);
            const newlyUnlocked = newlyUnlockedKeys.includes(b.key);
            const celebrate = shouldPlayAchievementUnlockCelebration([b.key], reducedMotion);
            const Icon = b.icon;
            const pct = getAchievementProgressPercent(b.progress, b.goal, unlocked);
            return (
              <GlassCard
                key={b.key}
                delay={i * 0.05}
                className={`relative overflow-hidden ${unlocked ? "achievement-card-unlocked" : ""} ${unlocked && !reducedMotion ? "animate-badge-glow" : ""}`}
              >
                {newlyUnlocked && (
                  <span className="sr-only" role="status" aria-live="polite">
                    New achievement unlocked: {b.title}
                  </span>
                )}
                {newlyUnlocked && celebrate && (
                  <span className="achievement-pixel-burst" aria-hidden="true">
                    {Array.from({ length: 6 }, (_, index) => (
                      <span className="achievement-pixel" key={index} />
                    ))}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      unlocked ? "bg-primary/25 text-primary" : "bg-white/6 text-foreground/50"
                    }`}
                  >
                    {unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`font-display text-2xl ${
                          unlocked ? "text-primary text-glow" : "text-foreground/70"
                        }`}
                      >
                        {b.title}
                      </p>
                      {unlocked && (
                        <span className="achievement-unlocked-badge">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Unlocked
                        </span>
                      )}
                    </div>
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
                  {unlocked ? `${b.goal} / ${b.goal} complete` : `${b.progress} / ${b.goal}`}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </PageShell>
    </>
  );
}
