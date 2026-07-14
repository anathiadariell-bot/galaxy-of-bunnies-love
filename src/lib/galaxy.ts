export const STAR_COLORS = {
  gold: "oklch(0.9 0.13 90)",
  rose: "oklch(0.85 0.13 20)",
  sky: "oklch(0.85 0.1 240)",
  sage: "oklch(0.87 0.11 160)",
  blush: "oklch(0.88 0.09 340)",
  violet: "oklch(0.82 0.13 300)",
} as const;
export type StarColor = keyof typeof STAR_COLORS;

export const EMOTIONS = [
  { key: "love", label: "Love", emoji: "💖" },
  { key: "joy", label: "Joy", emoji: "✨" },
  { key: "memory", label: "Memory", emoji: "🌙" },
  { key: "dream", label: "Dream", emoji: "🌠" },
  { key: "milestone", label: "Milestone", emoji: "🏆" },
  { key: "thanks", label: "Thanks", emoji: "🌷" },
] as const;
export type Emotion = (typeof EMOTIONS)[number]["key"];

export const THEMES = [
  {
    key: "night",
    label: "Midnight",
    description: "The original dreamy galaxy",
    colors: ["#1E1B2E", "#FFE4B5", "#BFE7FF", "#FFBBCB"],
  },
  {
    key: "rose",
    label: "Rose Nebula",
    description: "Warm blossoms and stardust",
    colors: ["#3B1F2B", "#FFB8C6", "#FFE0EC", "#E794C4"],
  },
  {
    key: "aurora",
    label: "Aurora",
    description: "Emerald skies over a still sea",
    colors: ["#12283F", "#A8F0D2", "#8ECBFF", "#B7E3E1"],
  },
  {
    key: "vanilla",
    label: "Vanilla Cream",
    description: "Golden hour, forever",
    colors: ["#3E2A1E", "#FBE2B7", "#F5C58F", "#F0A78A"],
  },
] as const;
export type ThemeKey = (typeof THEMES)[number]["key"];

export function daysBetween(from: string | null | undefined): number {
  if (!from) return 0;
  const start = new Date(from).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
}

export function applyTheme(theme: ThemeKey) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("olg-theme", theme);
  } catch {}
}

export function getStoredTheme(): ThemeKey {
  if (typeof document === "undefined") return "night";
  try {
    const t = localStorage.getItem("olg-theme") as ThemeKey | null;
    if (t && ["night", "rose", "aurora", "vanilla"].includes(t)) return t;
  } catch {}
  return "night";
}
