import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
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
      className={`${strong ? "glass-strong" : "glass"} animate-reveal rounded-3xl p-6 ${
        hover ? "transition hover:scale-[1.02] hover:bg-white/10" : ""
      } ${className}`}
      style={{ animationDelay: `${delay}s`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
