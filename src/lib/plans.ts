/**
 * Plan definitions for Our Little Galaxy.
 *
 * All limit logic lives here so there is a single source of truth.
 * When payments are wired in, only the `plan` field on the profile
 * needs to change — nothing else in the UI needs updating.
 */

export type Plan = "free" | "premium";

/** Themes available in the app (must match data-theme values in styles.css). */
export const ALL_THEMES = ["night", "rose", "aurora", "vanilla"] as const;
export type Theme = (typeof ALL_THEMES)[number];

export const PLAN_LIMITS = {
  free: {
    maxStars: 15,
    maxLetters: 10,
    allowedThemes: ["night"] as Theme[],
  },
  premium: {
    maxStars: Infinity,
    maxLetters: Infinity,
    allowedThemes: [...ALL_THEMES] as Theme[],
  },
} as const satisfies Record<Plan, { maxStars: number; maxLetters: number; allowedThemes: Theme[] }>;

/** Human-readable label for each plan. */
export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  premium: "Premium ✨",
};

/** Returns the limits object for a given plan (defaults to free). */
export function getLimits(plan: Plan | null | undefined) {
  return PLAN_LIMITS[plan ?? "free"];
}

/** Returns true when the user can add another star. */
export function canAddStar(plan: Plan | null | undefined, currentCount: number): boolean {
  return currentCount < getLimits(plan).maxStars;
}

/** Returns true when the user can add another letter. */
export function canAddLetter(plan: Plan | null | undefined, currentCount: number): boolean {
  return currentCount < getLimits(plan).maxLetters;
}

/** Returns true when the user's plan includes the given theme. */
export function canUseTheme(plan: Plan | null | undefined, theme: string): boolean {
  return (getLimits(plan).allowedThemes as string[]).includes(theme);
}

/** Returns a friendly message explaining why a star cannot be added. */
export function starLimitMessage(plan: Plan | null | undefined): string {
  const { maxStars } = getLimits(plan);
  return `You've reached your ${maxStars}-star limit on the Free plan. Upgrade to Premium for unlimited memories. ✨`;
}

/** Returns a friendly message explaining why a letter cannot be added. */
export function letterLimitMessage(plan: Plan | null | undefined): string {
  const { maxLetters } = getLimits(plan);
  return `You've reached your ${maxLetters}-letter limit on the Free plan. Upgrade to Premium for unlimited love letters. ✨`;
}
