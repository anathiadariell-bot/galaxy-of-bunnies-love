import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Heart } from "lucide-react";
import { NightSky } from "@/components/galaxy/NightSky";
import { MemoryJar } from "@/components/galaxy/MemoryJar";
import { MusicPlayer } from "@/components/galaxy/MusicPlayer";
import { Header } from "@/components/galaxy/Header";
import bunnyHer from "@/assets/bunny-her.png";
import bunnyHim from "@/assets/bunny-him.png";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
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
            to="/auth"
            className="group relative inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-medium text-primary-foreground shadow-lg transition-all hover:scale-105"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sparkles className="h-4 w-4" />
            Enter Our Galaxy
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full glass px-7 py-3 text-sm text-foreground/90 transition hover:bg-white/15"
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
                "radial-gradient(ellipse at 50% 60%, oklch(0.9 0.15 90 / 0.55), oklch(0.75 0.14 250 / 0.25) 45%, transparent 75%)",
            }}
          />

          <div className="relative mx-auto flex items-end justify-center">
            {/* Her — left, tucked against jar base */}
            <img
              src={bunnyHer}
              alt=""
              aria-hidden
              className="animate-float-y absolute bottom-0 left-[10%] sm:left-[14%] z-20 w-20 sm:w-24 md:w-28 lg:w-32"
              style={{
                animationDelay: "0.2s",
                filter:
                  "brightness(0.92) contrast(1.02) drop-shadow(0 6px 10px rgba(0,0,0,0.5)) drop-shadow(0 0 18px oklch(0.9 0.15 90 / 0.35))",
              }}
            />

            {/* Jar — focal point, sized down for balance */}
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
              className="animate-float-y absolute bottom-0 right-[10%] sm:right-[14%] z-20 w-20 sm:w-24 md:w-28 lg:w-32"
              style={{
                animationDelay: "1s",
                filter:
                  "brightness(0.92) contrast(1.02) drop-shadow(0 6px 10px rgba(0,0,0,0.5)) drop-shadow(0 0 18px oklch(0.85 0.1 240 / 0.35))",
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
