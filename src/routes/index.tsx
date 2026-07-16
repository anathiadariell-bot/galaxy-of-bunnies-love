import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { NightSky } from "@/components/galaxy/NightSky";
import { MemoryJar } from "@/components/galaxy/MemoryJar";
import { MusicPlayer } from "@/components/galaxy/MusicPlayer";
import { Header } from "@/components/galaxy/Header";
import { supabase } from "@/integrations/supabase/client";
import bunnyHer from "@/assets/bunny-her-pixel.png";
import bunnyHim from "@/assets/bunny-him-pixel.png";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  // Resolve session from localStorage (no network call, same as _authenticated/route.tsx).
  // null = not yet resolved; false = no session; true = has session.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
    // Keep in sync if auth state changes while the page is open.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Before session is resolved, default to /auth (safe fallback; resolves in <1 frame).
  const enterTo   = loggedIn ? "/dashboard" : "/auth";
  const beginTo   = loggedIn ? "/add-star"  : "/auth";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <NightSky />
      <Header />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center px-4 pt-28 pb-40 text-center sm:px-6 sm:pt-32 lg:px-8">
        <p className="animate-reveal mb-4 flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-primary/90">
          <Sparkles className="h-3 w-3" /> a place for us
        </p>

        <h1 className="animate-reveal font-display text-6xl leading-[0.95] text-glow text-primary sm:text-7xl md:text-8xl lg:text-[9rem]" style={{ animationDelay: "0.15s" }}>
          Our Little
          <br />
          <span className="italic">Galaxy</span>
        </h1>

        <p className="animate-reveal mt-6 max-w-md text-base text-foreground/85 sm:text-lg" style={{ animationDelay: "0.35s" }}>
          Every memory becomes a star.
        </p>

        <div className="animate-reveal mt-10 flex flex-col items-center gap-3 sm:flex-row" style={{ animationDelay: "0.55s" }}>
          <Link
            to={enterTo}
            className="group relative inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-lg text-primary-foreground shadow-lg transition-all hover:scale-105"
            style={{ background: "var(--gradient-primary)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontStyle: "italic", letterSpacing: "0.04em" }}
          >
            <Sparkles className="h-4 w-4 not-italic" />
            Enter Our Galaxy
          </Link>
          <Link
            to={beginTo}
            className="inline-flex items-center gap-2 rounded-full glass px-7 py-3 text-lg text-foreground/90 transition hover:bg-white/15"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontStyle: "italic", letterSpacing: "0.04em" }}
          >
            <Heart className="h-4 w-4 text-accent" />
            Begin Our Story
          </Link>
        </div>

        {/* Jar + bunnies cinematic scene */}
        <div className="relative mt-14 w-full max-w-3xl">
          {/* Shared ground glow — single light source uniting jar + bunnies */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto h-40 w-[85%] rounded-[50%] blur-3xl opacity-70"
            style={{
              background:
                "radial-gradient(ellipse at 50% 60%, oklch(0.82 0.14 280 / 0.52), oklch(0.85 0.10 320 / 0.28) 40%, oklch(0.92 0.16 90 / 0.18) 65%, transparent 78%)",
            }}
          />

          <div className="relative mx-auto flex items-end justify-center">
            {/* Her — left, standing beside the jar */}
            <img
              src={bunnyHer}
              alt=""
              aria-hidden
              className="animate-bunny-idle absolute bottom-0 left-[4%] sm:left-[8%] md:left-[10%] z-20 w-32 sm:w-36 md:w-44 lg:w-48"
              style={{
                animationDelay: "0s",
                imageRendering: "pixelated",
                filter: [
                  /* crisp pixel-art ground shadow */
                  "drop-shadow(4px 4px 0px oklch(0.08 0.03 255 / 0.85))",
                  /* warm candlelight halo */
                  "drop-shadow(0 0 22px oklch(0.90 0.15 78 / 0.50))",
                  /* soft pink accent glow matching her ribbon */
                  "drop-shadow(0 0 10px oklch(0.74 0.09 8 / 0.30))",
                ].join(" "),
              }}
            />

            {/* Jar — focal point, unchanged sizing */}
            <div className="relative z-10">
              <MemoryJar size={260} className="sm:hidden" />
              <div className="hidden sm:block md:hidden">
                <MemoryJar size={300} />
              </div>
              <div className="hidden md:block lg:hidden">
                <MemoryJar size={340} />
              </div>
              <div className="hidden lg:block">
                <MemoryJar size={360} />
              </div>
            </div>

            {/* Him — right, mirrored */}
            <img
              src={bunnyHim}
              alt=""
              aria-hidden
              className="animate-bunny-idle-r absolute bottom-0 right-[4%] sm:right-[8%] md:right-[10%] z-20 w-32 sm:w-36 md:w-44 lg:w-48"
              style={{
                animationDelay: "0.9s",
                imageRendering: "pixelated",
                filter: [
                  /* crisp pixel-art ground shadow */
                  "drop-shadow(4px 4px 0px oklch(0.08 0.03 255 / 0.85))",
                  /* warm candlelight halo */
                  "drop-shadow(0 0 22px oklch(0.90 0.15 78 / 0.45))",
                  /* blue accent glow matching his scarf */
                  "drop-shadow(0 0 10px oklch(0.66 0.12 240 / 0.30))",
                ].join(" "),
              }}
            />
          </div>

          {/* Contact shadow on shared ground plane */}
          <div
            aria-hidden
            className="mx-auto mt-1 h-10 w-2/3 rounded-[50%] opacity-60 blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)",
            }}
          />
        </div>
      </main>

      <MusicPlayer />
    </div>
  );
}
