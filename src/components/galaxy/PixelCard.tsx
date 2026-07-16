/**
 * PixelCard — Cozy Pixel Edition reusable card component.
 *
 * Variants:
 *   default  — cozy-card (warm coffee bg + gold border + pixel shadow)
 *   glass    — translucent warm glass panel
 *   warm     — solid coffee-brown opaque panel
 *   pink     — dusty pink tinted card
 *   olive    — soft olive tinted card
 *   gold     — golden highlight card
 *
 * Usage:
 *   <PixelCard variant="pink" delay={0.1}>…</PixelCard>
 */
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PixelCardVariant = "default" | "glass" | "warm" | "pink" | "olive" | "gold";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: PixelCardVariant;
  hover?: boolean;
  delay?: number;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantClasses: Record<PixelCardVariant, string> = {
  default: "cozy-card",
  glass:   "glass",
  warm:    "cozy-panel",
  pink:    "bg-pixel-pink/15 border-2 border-pixel-pink/35 pixel-shadow-pink",
  olive:   "bg-pixel-olive/15 border-2 border-pixel-olive/35 pixel-shadow",
  gold:    "bg-pixel-gold/12 border-2 border-pixel-gold/40 pixel-shadow-gold",
};

const paddingClasses = {
  none: "",
  sm:   "p-3",
  md:   "p-5",
  lg:   "p-7",
};

export function PixelCard({
  children,
  variant = "default",
  hover = true,
  delay = 0,
  padding = "md",
  className = "",
  style,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        "animate-pixel-pop rounded-lg",
        paddingClasses[padding],
        hover && "transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105",
        className,
      )}
      style={{ animationDelay: `${delay}s`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Convenience sub-components for structured pixel cards ── */

export function PixelCardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-3 flex items-center gap-2 border-b border-border pb-3", className)}
      {...props}
    />
  );
}

export function PixelCardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-lg text-primary", className)}
      {...props}
    />
  );
}

export function PixelCardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-foreground/80", className)} {...props} />;
}

export function PixelCardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 flex items-center gap-2 border-t border-border pt-3", className)}
      {...props}
    />
  );
}
