import { useEffect } from "react";
import { applyTheme, getStoredTheme, type ThemeKey } from "@/lib/galaxy";
import { useProfile } from "@/hooks/useGalaxyData";

/** Applies the saved theme on mount; syncs to profile.theme when signed in. */
export function ThemeBoot() {
  const { data: profile } = useProfile();
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);
  useEffect(() => {
    if (profile?.theme && ["night", "rose", "aurora", "vanilla"].includes(profile.theme)) {
      applyTheme(profile.theme as ThemeKey);
    }
  }, [profile?.theme]);
  return null;
}
