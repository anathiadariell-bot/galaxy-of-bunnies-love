import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NightSky } from "@/components/galaxy/NightSky";
import { MemoryJar } from "@/components/galaxy/MemoryJar";
import { MusicPlayer } from "@/components/galaxy/MusicPlayer";
import { Header } from "@/components/galaxy/Header";
import {
  Star, Image as ImageIcon, Video, Mic, Mail, Trophy, CalendarHeart, Plus, LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

interface Profile {
  display_name: string | null;
  together_since: string | null;
}

function daysBetween(from: string | null): number {
  if (!from) return 0;
  const start = new Date(from).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
}

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? null });
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("display_name, together_since").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const stats = [
    { label: "Stars", value: 0, icon: Star, color: "oklch(0.9 0.13 90)" },
    { label: "Photos", value: 0, icon: ImageIcon, color: "oklch(0.85 0.1 240)" },
    { label: "Videos", value: 0, icon: Video, color: "oklch(0.85 0.12 320)" },
    { label: "Voice Memories", value: 0, icon: Mic, color: "oklch(0.87 0.11 160)" },
    { label: "Letters", value: 0, icon: Mail, color: "oklch(0.87 0.05 20)" },
    { label: "Achievements", value: 0, icon: Trophy, color: "oklch(0.9 0.13 90)" },
    { label: "Days Together", value: daysBetween(profile?.together_since ?? null), icon: CalendarHeart, color: "oklch(0.85 0.1 20)" },
  ];

  const firstName = profile?.display_name ?? user?.email?.split("@")[0] ?? "love";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <NightSky />
      <Header />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 animate-reveal">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Your Galaxy</p>
            <h1 className="font-display text-5xl text-primary text-glow sm:text-6xl">Hi, {firstName}</h1>
            <p className="mt-2 text-sm text-foreground/75">Every memory becomes a star. Add one today.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast("Coming soon ✨", { description: "Add Star will open here." })}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground hover:scale-105 transition"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="h-4 w-4" /> Add Star
            </button>
            <button
              onClick={signOut}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-foreground/85 hover:bg-white/15"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        {/* Central jar + orbiting stat cards */}
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="grid grid-cols-2 gap-4 lg:gap-6 order-2 lg:order-1">
            {stats.slice(0, 4).map((s, i) => (
              <StatCard key={s.label} {...s} delay={i * 0.08} />
            ))}
          </div>

          <div className="flex justify-center order-1 lg:order-2 animate-reveal" style={{ animationDelay: "0.2s" }}>
            <MemoryJar size={380} />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:gap-6 order-3">
            {stats.slice(4).map((s, i) => (
              <StatCard key={s.label} {...s} delay={0.32 + i * 0.08} />
            ))}
          </div>
        </div>
      </main>

      <MusicPlayer />
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color, delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="glass animate-reveal rounded-3xl p-5 transition hover:scale-[1.03] hover:bg-white/10"
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ background: `${color.replace(")", " / 0.15)")}`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-4xl text-primary text-glow">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-foreground/70">{label}</p>
    </div>
  );
}
