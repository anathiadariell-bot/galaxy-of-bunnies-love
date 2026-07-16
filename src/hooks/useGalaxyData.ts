import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  type Plan,
  canAddStar,
  canAddLetter,
  canUseTheme,
  getLimits,
  starLimitMessage,
  letterLimitMessage,
} from "@/lib/plans";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  partner_name: string | null;
  together_since: string | null;
  theme: string | null;
  /** Subscription tier — 'free' (default) or 'premium'. */
  plan: Plan;
}

export interface Star {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  color: string;
  emotion: string;
  starred_on: string;
  created_at: string;
}

export interface Letter {
  id: string;
  user_id: string;
  title: string;
  body: string;
  unlock_at: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}

// ─────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────

export function useProfile() {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const user = useAuthUser();
  return useMutation({
    mutationFn: async (patch: {
      display_name?: string | null;
      partner_name?: string | null;
      together_since?: string | null;
      theme?: string;
      avatar_url?: string | null;
      /** Reserved for payment webhook — do not call directly from UI. */
      plan?: Plan;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Plan helpers
// ─────────────────────────────────────────────────────────────

/**
 * Returns the current user's plan ('free' | 'premium') and their limits.
 * Defaults to 'free' while the profile is loading.
 */
export function usePlan() {
  const { data: profile, isLoading } = useProfile();
  const plan: Plan = profile?.plan ?? "free";
  return { plan, limits: getLimits(plan), isLoading };
}

/**
 * Returns whether the user can add another star, plus a reason string if not.
 * Depends on the live star count so it stays in sync after additions/deletions.
 */
export function useStarLimit() {
  const { plan, isLoading: planLoading } = usePlan();
  const { data: stars = [], isLoading: starsLoading } = useStars();
  const count = stars.length;
  const allowed = canAddStar(plan, count);
  return {
    allowed,
    count,
    max: getLimits(plan).maxStars,
    reason: allowed ? null : starLimitMessage(plan),
    isLoading: planLoading || starsLoading,
  };
}

/**
 * Returns whether the user can add another letter, plus a reason string if not.
 */
export function useLetterLimit() {
  const { plan, isLoading: planLoading } = usePlan();
  const { data: letters = [], isLoading: lettersLoading } = useLetters();
  const count = letters.length;
  const allowed = canAddLetter(plan, count);
  return {
    allowed,
    count,
    max: getLimits(plan).maxLetters,
    reason: allowed ? null : letterLimitMessage(plan),
    isLoading: planLoading || lettersLoading,
  };
}

/**
 * Returns whether the user's plan allows a specific theme.
 */
export function useThemeAllowed(theme: string): boolean {
  const { plan } = usePlan();
  return canUseTheme(plan, theme);
}

// ─────────────────────────────────────────────────────────────
// Stars
// ─────────────────────────────────────────────────────────────

export function useStars() {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["stars", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Star[]> => {
      const { data, error } = await supabase
        .from("stars")
        .select("*")
        .order("starred_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Star[];
    },
  });
}

export function useCreateStar() {
  const qc = useQueryClient();
  const user = useAuthUser();
  const { plan } = usePlan();
  const { data: stars = [] } = useStars();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      note: string;
      color: string;
      emotion: string;
      starred_on: string;
    }) => {
      if (!user) throw new Error("Not signed in");

      // Enforce plan limit before hitting the database
      if (!canAddStar(plan, stars.length)) {
        throw new Error(starLimitMessage(plan));
      }

      const { data, error } = await supabase
        .from("stars")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Star;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stars"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Letters
// ─────────────────────────────────────────────────────────────

export function useLetters() {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["letters", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Letter[]> => {
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Letter[];
    },
  });
}

export function useCreateLetter() {
  const qc = useQueryClient();
  const user = useAuthUser();
  const { plan } = usePlan();
  const { data: letters = [] } = useLetters();

  return useMutation({
    mutationFn: async (input: { title: string; body: string; unlock_at: string | null }) => {
      if (!user) throw new Error("Not signed in");

      // Enforce plan limit before hitting the database
      if (!canAddLetter(plan, letters.length)) {
        throw new Error(letterLimitMessage(plan));
      }

      const { data, error } = await supabase
        .from("letters")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Letter;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["letters"] });
    },
  });
}
