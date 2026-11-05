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
    /** Date lock + PIN lock on gift stars — free plan cannot use these. */
    giftLocks: false,
  },
  premium: {
    maxStars: Infinity,
    maxLetters: Infinity,
    allowedThemes: [...ALL_THEMES] as Theme[],
    /** Date lock + PIN lock on gift stars — both enabled on premium. */
    giftLocks: true,
  },
} as const satisfies Record<
  Plan,
  { maxStars: number; maxLetters: number; allowedThemes: Theme[]; giftLocks: boolean }
>;

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

/**
 * Returns true when the user's plan allows gift lock features
 * (date lock and PIN lock on gift stars).
 */
export function canUseGiftLocks(plan: Plan | null | undefined): boolean {
  return getLimits(plan).giftLocks;
}

/** Returns a friendly message explaining why gift locks require an upgrade. */
export function giftLocksMessage(): string {
  return "Date locks and PIN locks on gift stars are a Premium feature. Upgrade to keep your messages sealed until just the right moment. ✨";
}
