import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  partner_name: string | null;
  together_since: string | null;
  theme: string | null;
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

export function useCreateStar() {
  const qc = useQueryClient();
  const user = useAuthUser();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      note: string;
      color: string;
      emotion: string;
      starred_on: string;
    }) => {
      if (!user) throw new Error("Not signed in");
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

export function useCreateLetter() {
  const qc = useQueryClient();
  const user = useAuthUser();
  return useMutation({
    mutationFn: async (input: { title: string; body: string; unlock_at: string | null }) => {
      if (!user) throw new Error("Not signed in");
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

export function useUpdateProfile() {
  const qc = useQueryClient();
  const user = useAuthUser();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<Profile, "id">>) => {
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
