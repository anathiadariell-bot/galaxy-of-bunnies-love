export type LetterOpeningMode = "locked" | "immediate" | "reveal";

export const LETTER_REVEAL_DURATION_MS = 4200;

export function getLetterOpeningMode(
  unlockAt: string | null,
  now = Date.now(),
  prefersReducedMotion = false,
): LetterOpeningMode {
  if (unlockAt && new Date(unlockAt).getTime() > now) {
    return "locked";
  }

  if (unlockAt && !prefersReducedMotion) {
    return "reveal";
  }

  return "immediate";
}
