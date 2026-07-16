import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CozyRoom } from "@/components/galaxy/CozyRoom";
import { MemoryJar } from "@/components/galaxy/MemoryJar";
import { MusicPlayer } from "@/components/galaxy/MusicPlayer";
import { Header } from "@/components/galaxy/Header";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import bunnyHer from "@/assets/bunny-her-pixel.png";
import bunnyHim from "@/assets/bunny-him-pixel.png";
import {
  Star as StarIcon, Image as ImageIcon, Video, Mic,
  Mail, Trophy, CalendarHeart, Plus, LogOut, PenLine, Sparkles,
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

  const primaryStats = [
    { label: "Stars",        value: stars.length,   icon: StarIcon,     color: STAR_COLORS.gold,  to: "/my-jar"       as const },
    { label: "Letters",      value: letters.length,  icon: Mail,         color: STAR_COLORS.blush, to: "/love-letters" as const },
    { label: "Achievements", value: unlockedCount(stars.length, letters.length, daysBetween(profile?.together_since)), icon: Trophy, color: STAR_COLORS.gold, to: "/achievements" as const },
    { label: "Days Together",value: daysBetween(profile?.together_since), icon: CalendarHeart, color: STAR_COLORS.rose, to: "/settings" as const },
  ];

  const soonStats = [
    { label: "Photos",         value: 0, icon: ImageIcon, color: STAR_COLORS.sky,    soon: true },
    { label: "Videos",         value: 0, icon: Video,     color: STAR_COLORS.violet, soon: true },
    { label: "Voice Memories", value: 0, icon: Mic,       color: STAR_COLORS.sage,   soon: true },
  ];

  const firstName = profile?.display_name ?? user?.email?.split("@")[0] ?? "love";
  const recent = stars.slice(0, 6);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeBoot />
      <CozyRoom />
      <Header />

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-32 sm:px-6 lg:px-8" style={{ paddingTop: "max(5.5rem, 9vh)" }}>

        {/* ── 1. Greeting ─────────────────────────────── */}
        <div className="animate-reveal mb-8 text-center">
          <p className="mb-1 text-[11px] uppercase tracking-[0.35em] text-primary/65">your little galaxy</p>
          <h1 className="font-display text-6xl text-primary text-glow sm:text-7xl">{firstName}</h1>
          <p className="font-elegant mt-3 text-lg text-foreground/60">Every memory becomes a star.</p>
        </div>

        {/* ── 2. Jar on shelf with bunnies ─────────────── */}
        <div
          className="animate-reveal"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="flex items-end justify-center">

            {/* ── Her — left bunny, sitting beside shelf ── */}
            <img
              src={bunnyHer}
              alt=""
              aria-hidden
              className="animate-bunny-idle relative z-10 w-24 sm:w-28 md:w-32 mb-7 flex-shrink-0"
              style={{
                animationDelay: "0.3s",
                imageRendering: "pixelated",
                filter: [
                  "drop-shadow(3px 3px 0px oklch(0.08 0.03 255 / 0.80))",
                  "drop-shadow(0 0 18px oklch(0.90 0.15 78 / 0.45))",
                  "drop-shadow(0 0 8px oklch(0.74 0.09 8 / 0.28))",
                ].join(" "),
              }}
            />

            {/* ── Centre: jar + shelf ── */}
            <div className="relative z-20 flex flex-col items-center">
              {/* Jar ambient glow on wall */}
              <div
                aria-hidden
                className="pointer-events-none absolute h-56 w-72 rounded-full blur-3xl opacity-20"
                style={{ background: "radial-gradient(ellipse, oklch(0.88 0.16 80), transparent 70%)" }}
              />

              {/* The jar — animate-float-jar is already inside MemoryJar */}
              <MemoryJar size={240} />

              {/* Wooden shelf */}
              <div className="relative -mt-3 w-full max-w-xs sm:max-w-sm">
                {/* Top highlight sliver */}
                <div
                  className="h-[3px] w-full rounded-t-sm"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.48 0.09 64 / 0.25), oklch(0.62 0.10 68 / 0.65) 35%, oklch(0.55 0.09 65 / 0.45) 70%, oklch(0.45 0.08 60 / 0.22))",
                  }}
                />
                {/* Shelf body */}
                <div
                  className="h-6 w-full"
                  style={{
                    background:
                      "linear-gradient(180deg, oklch(0.37 0.09 54) 0%, oklch(0.29 0.08 50) 50%, oklch(0.23 0.06 46) 100%)",
                    boxShadow:
                      "0 6px 28px oklch(0.09 0.04 40 / 0.85), inset 0 1px 0 oklch(0.52 0.08 65 / 0.30)",
                  }}
                />
                {/* Jar contact glow on shelf top */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-[3px] left-1/2 h-4 w-24 -translate-x-1/2 blur-xl"
                  style={{ background: "oklch(0.90 0.15 82 / 0.45)" }}
                />
              </div>

              {/* Drop shadow below shelf */}
              <div
                aria-hidden
                className="-mt-1 h-8 w-3/4 blur-xl opacity-50"
                style={{ background: "radial-gradient(ellipse, oklch(0.08 0.03 40), transparent 70%)" }}
              />
            </div>

            {/* ── Him — right bunny, sitting beside shelf ── */}
            <img
              src={bunnyHim}
              alt=""
              aria-hidden
              className="animate-bunny-idle-r relative z-10 w-24 sm:w-28 md:w-32 mb-7 flex-shrink-0"
              style={{
                animationDelay: "1.1s",
                imageRendering: "pixelated",
                filter: [
                  "drop-shadow(3px 3px 0px oklch(0.08 0.03 255 / 0.80))",
                  "drop-shadow(0 0 18px oklch(0.90 0.15 78 / 0.40))",
                  "drop-shadow(0 0 8px oklch(0.66 0.12 240 / 0.28))",
                ].join(" "),
              }}
            />

          </div>
        </div>

        {/* ── 3. Primary stat cards ─────────────────── */}
        <div
          className="animate-reveal mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
          style={{ animationDelay: "0.30s" }}
        >
          {primaryStats.map((s, i) => (
            <StatCard key={s.label} {...s} delay={0.30 + i * 0.06} />
          ))}
        </div>

        {/* ── 4. Coming-soon compact row ─────────────── */}
        <div
          className="animate-reveal mt-3 grid grid-cols-3 gap-3"
          style={{ animationDelay: "0.52s" }}
        >
          {soonStats.map((s, i) => (
            <StatCard key={s.label} {...s} delay={0.52 + i * 0.06} compact />
          ))}
        </div>

        {/* ── 5. Action buttons ──────────────────────── */}
        <div
          className="animate-reveal mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "0.60s" }}
        >
          <Link
            to="/add-star"
            className="font-elegant inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg text-primary-foreground shadow-lg transition hover:scale-[1.04]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4 not-italic" /> Add a Star
          </Link>
          <Link
            to="/love-letters"
            className="font-elegant glass inline-flex items-center gap-2 rounded-full px-5 py-3 text-lg text-foreground/85 transition hover:bg-white/15"
          >
            <PenLine className="h-4 w-4 not-italic text-accent" /> Write a Letter
          </Link>
          <button
            onClick={signOut}
            className="font-elegant glass inline-flex items-center gap-2 rounded-full px-5 py-3 text-lg text-foreground/65 transition hover:bg-white/15"
          >
            <LogOut className="h-4 w-4 not-italic" /> Sign out
          </button>
        </div>

        {/* ── 6. Recent memories ─────────────────────── */}
        {recent.length > 0 && (
          <section
            className="animate-reveal mt-16"
            style={{ animationDelay: "0.75s" }}
          >
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-display text-3xl text-primary text-glow">Recent stars</h2>
              <Link
                to="/my-jar"
                className="font-elegant text-base text-foreground/55 transition hover:text-primary"
              >
                View all →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((s, i) => {
                const color = STAR_COLORS[s.color as StarColor] ?? STAR_COLORS.gold;
                return (
                  <div
                    key={s.id}
                    className="glass animate-reveal rounded-3xl p-5 transition hover:bg-white/10"
                    style={{ animationDelay: `${0.75 + i * 0.06}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: `${color}22`, color }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-xl text-primary">{s.title}</p>
                        <p className="font-elegant text-sm text-foreground/55">
                          {new Date(s.starred_on).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {s.note && (
                      <p className="font-elegant mt-3 line-clamp-3 text-base text-foreground/75">
                        {s.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <MusicPlayer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

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
  label, value, icon: Icon, color, delay = 0, to, soon, compact,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay?: number;
  to?: "/my-jar" | "/love-letters" | "/achievements" | "/settings";
  soon?: boolean;
  compact?: boolean;
}) {
  const inner = (
    <div
      className="glass animate-reveal relative rounded-3xl transition hover:scale-[1.04] hover:bg-white/10"
      style={{
        animationDelay: `${delay}s`,
        padding: compact ? "0.75rem 1rem" : "1.1rem 1.25rem",
      }}
    >
      {soon && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-foreground/55">
          soon
        </span>
      )}
      <div
        className="mb-2.5 flex items-center justify-center rounded-xl"
        style={{
          width: compact ? 36 : 42,
          height: compact ? 36 : 42,
          background: `${color}1a`,
          color,
        }}
      >
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </div>
      <p
        className="font-display text-primary text-glow"
        style={{ fontSize: compact ? "1.6rem" : "2.25rem", lineHeight: 1 }}
      >
        {value}
      </p>
      <p className="font-elegant mt-1 text-foreground/65" style={{ fontSize: compact ? "0.75rem" : "0.82rem" }}>
        {label}
      </p>
    </div>
  );

  if (to && !soon) return <Link to={to}>{inner}</Link>;
  return inner;
}
