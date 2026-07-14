import type { ReactNode } from "react";
import { NightSky } from "./NightSky";
import { Header } from "./Header";
import { MusicPlayer } from "./MusicPlayer";

interface Props {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  wide?: boolean;
}

export function PageShell({ children, eyebrow, title, subtitle, actions, wide }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <NightSky />
      <Header />
      <main
        className={`relative z-10 mx-auto px-4 pt-28 pb-24 sm:px-6 lg:px-8 ${
          wide ? "max-w-7xl" : "max-w-6xl"
        }`}
      >
        {(eyebrow || title || subtitle || actions) && (
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 animate-reveal">
            <div>
              {eyebrow && (
                <p className="text-xs uppercase tracking-[0.3em] text-primary/80">{eyebrow}</p>
              )}
              {title && (
                <h1 className="font-display text-5xl text-primary text-glow sm:text-6xl">{title}</h1>
              )}
              {subtitle && <p className="mt-2 max-w-xl text-sm text-foreground/75">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
      <MusicPlayer />
    </div>
  );
}
