export interface AchievementProgress {
  key: string;
  progress: number;
  goal: number;
}

export interface AchievementUnlockReconciliation {
  unlockedKeys: string[];
  newlyUnlockedKeys: string[];
}

export function getAchievementStorageKey(userId: string): string {
  return `olg-achievements-unlocked:v1:${userId}`;
}

export function parseStoredAchievementKeys(value: string | null): string[] | null {
  if (value === null) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || !parsed.every((key) => typeof key === "string")) {
      return null;
    }
    return [...new Set(parsed)];
  } catch {
    return null;
  }
}

export function reconcileAchievementUnlocks(
  achievements: readonly AchievementProgress[],
  storedKeys: readonly string[] | null,
): AchievementUnlockReconciliation {
  const stored = new Set(storedKeys ?? []);
  const reachedKeys = achievements
    .filter((achievement) => achievement.goal > 0 && achievement.progress >= achievement.goal)
    .map((achievement) => achievement.key);

  // A first visit has no history to compare against, so seed already-earned
  // achievements without replaying celebrations for old progress.
  const newlyUnlockedKeys =
    storedKeys === null ? [] : reachedKeys.filter((key) => !stored.has(key));

  return {
    unlockedKeys: [...new Set([...stored, ...reachedKeys])],
    newlyUnlockedKeys,
  };
}

export function shouldPlayAchievementUnlockCelebration(
  newlyUnlockedKeys: readonly string[],
  reducedMotion: boolean,
): boolean {
  return newlyUnlockedKeys.length > 0 && !reducedMotion;
}

export function getAchievementProgressPercent(
  progress: number,
  goal: number,
  unlocked: boolean,
): number {
  if (goal <= 0) return 0;
  const completedProgress = unlocked ? goal : progress;
  return Math.max(0, Math.min(100, Math.round((completedProgress / goal) * 100)));
}
