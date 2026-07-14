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

        {/* Jar + bunnies scene */}
        <div className="relative mt-16 w-full max-w-5xl">
          <div className="relative mx-auto flex items-end justify-center">
            <img
              src={bunnyHer}
              alt=""
              className="animate-float-y hidden sm:block absolute bottom-4 left-[10%] w-28 sm:w-36 md:w-44 lg:w-52 drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]"
              style={{ animationDelay: "0.2s" }}
            />
            <MemoryJar size={340} className="mx-auto sm:hidden" />
            <div className="hidden sm:block">
              <MemoryJar size={420} />
            </div>
            <img
              src={bunnyHim}
              alt=""
              className="animate-float-y hidden sm:block absolute bottom-4 right-[10%] w-28 sm:w-36 md:w-44 lg:w-52 drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]"
              style={{ animationDelay: "1s" }}
            />
          </div>

          {/* Reflection */}
          <div
            aria-hidden
            className="mx-auto mt-2 h-20 w-3/4 rounded-full opacity-50 blur-2xl"
            style={{ background: "radial-gradient(ellipse, oklch(0.9 0.15 90 / 0.5), transparent 70%)" }}
          />
        </div>

        {/* Small mobile-only bunny row */}
        <div className="mt-6 flex w-full justify-between px-4 sm:hidden">
          <img src={bunnyHer} alt="" className="w-24 animate-float-y" />
          <img src={bunnyHim} alt="" className="w-24 animate-float-y" style={{ animationDelay: "1s" }} />
        </div>
      </main>

      <MusicPlayer />
    </div>
  );
}
