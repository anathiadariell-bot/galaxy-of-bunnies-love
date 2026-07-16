import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: "/add-star" | "/love-letters" | "/my-jar" | "/dashboard";
}

export function EmptyState({ icon, title, description, ctaLabel, ctaTo }: Props) {
  return (
    <div className="glass animate-reveal mx-auto flex max-w-lg flex-col items-center rounded-3xl p-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-primary">
        {icon ?? <Sparkles className="h-6 w-6" />}
      </div>
      <h3 className="font-display text-3xl text-primary text-glow">{title}</h3>
      {description && <p className="font-elegant mt-2 text-base text-foreground/75">{description}</p>}
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="font-elegant mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-lg text-primary-foreground hover:scale-105 transition"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-4 w-4 not-italic" /> {ctaLabel}
        </Link>
      )}
    </div>
  );
}
