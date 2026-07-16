import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { NightSky } from "@/components/galaxy/NightSky";
import { MemoryJar } from "@/components/galaxy/MemoryJar";
import { MusicPlayer } from "@/components/galaxy/MusicPlayer";
import { Header } from "@/components/galaxy/Header";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import {
  Star as StarIcon, Image as ImageIcon, Video, Mic, Mail, Trophy, CalendarHeart, Plus, LogOut, PenLine, Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLetters, useProfile, useStars, useAuthUser } from "@/hooks/useGalaxyData";
import { daysBetween, STAR_COLORS, type StarColor } from "@/lib/galaxy";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Galaxy — Our Little Galaxy" },
      { name: "description", content: "Your dreamy dashboard of stars, letters, and shared memories." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const { data: profile } = useProfile();
  const { data: stars = [] } = useStars();
  const { data: letters = [] } = useLetters();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const stats = [
    { label: "Stars", value: stars.length, icon: StarIcon, color: STAR_COLORS.gold, to: "/my-jar" as const },
    { label: "Photos", value: 0, icon: ImageIcon, color: STAR_COLORS.sky, soon: true },
    { label: "Videos", value: 0, icon: Video, color: STAR_COLORS.violet, soon: true },
    { label: "Voice Memories", value: 0, icon: Mic, color: STAR_COLORS.sage, soon: true },
    { label: "Letters", value: letters.length, icon: Mail, color: STAR_COLORS.blush, to: "/love-letters" as const },
    { label: "Achievements", value: unlockedCount(stars.length, letters.length, daysBetween(profile?.together_since)), icon: Trophy, color: STAR_COLORS.gold, to: "/achievements" as const },
    { label: "Days Together", value: daysBetween(profile?.together_since), icon: CalendarHeart, color: STAR_COLORS.rose, to: "/settings" as const },
  ];

  const firstName = profile?.display_name ?? user?.email?.split("@")[0] ?? "love";
  const recent = stars.slice(0, 6);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeBoot />
      <NightSky />
      <Header />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 animate-reveal">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Your Galaxy</p>
            <h1 className="font-display text-5xl text-primary text-glow sm:text-6xl">Hi, {firstName}</h1>
            <p className="font-elegant mt-2 text-base text-foreground/75">Every memory becomes a star. Add one today.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/add-star"
              className="font-elegant inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-lg text-primary-foreground hover:scale-105 transition"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="h-4 w-4 not-italic" /> Add Star
            </Link>
            <Link
              to="/love-letters"
              className="font-elegant glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-lg text-foreground/90 hover:bg-white/15"
            >
              <PenLine className="h-4 w-4 not-italic text-accent" /> Write a Letter
            </Link>
            <button
              onClick={signOut}
              className="font-elegant glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-lg text-foreground/85 hover:bg-white/15"
            >
              <LogOut className="h-4 w-4 not-italic" /> Sign out
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
            <MemoryJar size={340} />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:gap-6 order-3">
            {stats.slice(4).map((s, i) => (
              <StatCard key={s.label} {...s} delay={0.32 + i * 0.08} />
            ))}
          </div>
        </div>

        {/* Recent stars strip */}
        {recent.length > 0 && (
          <section className="mt-16 animate-reveal" style={{ animationDelay: "0.6s" }}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-3xl text-primary text-glow">Recent stars</h2>
              <Link to="/my-jar" className="text-sm text-foreground/70 hover:text-primary">View all →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((s) => (
                <div key={s.id} className="glass rounded-3xl p-5 transition hover:bg-white/10">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl"
                      style={{ background: `${STAR_COLORS[s.color as StarColor] ?? STAR_COLORS.gold} / 0.15`, color: STAR_COLORS[s.color as StarColor] ?? STAR_COLORS.gold }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl text-primary">{s.title}</p>
                      <p className="font-elegant text-sm text-foreground/60">{new Date(s.starred_on).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {s.note && <p className="font-elegant mt-3 line-clamp-3 text-base text-foreground/80">{s.note}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <MusicPlayer />
    </div>
  );
}

function unlockedCount(stars: number, letters: number, days: number): number {
  let n = 0;
  if (stars >= 1) n++;
  if (stars >= 10) n++;
  if (stars >= 50) n++;
  if (letters >= 1) n++;
  if (letters >= 5) n++;
  if (days >= 100) n++;
  if (days >= 365) n++;
  return n;
}

function StatCard({
  label, value, icon: Icon, color, delay = 0, to, soon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay?: number;
  to?: "/my-jar" | "/love-letters" | "/achievements" | "/settings";
  soon?: boolean;
}) {
  const inner = (
    <div className="glass animate-reveal relative rounded-3xl p-5 transition hover:scale-[1.03] hover:bg-white/10" style={{ animationDelay: `${delay}s` }}>
      {soon && (
        <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-foreground/70">
          soon
        </span>
      )}
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ background: `${color} / 0.15`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-4xl text-primary text-glow">{value}</p>
      <p className="font-elegant mt-1 text-sm text-foreground/70">{label}</p>
    </div>
  );
  if (to && !soon) return <Link to={to}>{inner}</Link>;
  return inner;
}
