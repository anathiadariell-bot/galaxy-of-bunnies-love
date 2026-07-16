import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** true = cozy-card (more opaque, pixel shadow); false = glass (translucent) */
  hover?: boolean;
  /** strong = glass-strong; default = glass */
  strong?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  hover = true,
  strong = false,
  delay = 0,
  className = "",
  style,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        "animate-reveal rounded-xl p-6",
        hover && "cursor-default transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105",
        className,
      )}
      style={{ animationDelay: `${delay}s`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
