import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Base: pixel-rounded, 2px border, tight pixel feel
  "inline-flex items-center rounded px-2.5 py-0.5 text-xs font-bold border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Golden — primary accent
        default:
          "border-primary/40 bg-primary/20 text-primary pixel-shadow-sm hover:bg-primary/30",
        // Coffee — secondary, muted
        secondary:
          "border-secondary/60 bg-secondary/60 text-secondary-foreground pixel-shadow-sm hover:bg-secondary/80",
        // Destructive
        destructive:
          "border-destructive/40 bg-destructive/20 text-destructive pixel-shadow-sm hover:bg-destructive/30",
        // Outline — border only
        outline:
          "border-border bg-transparent text-foreground hover:border-primary/50",
        // Pink — dusty pink variant
        pink:
          "border-pixel-pink/50 bg-pixel-pink/20 text-pixel-pink pixel-shadow-sm hover:bg-pixel-pink/30",
        // Olive — soft olive variant
        olive:
          "border-pixel-olive/50 bg-pixel-olive/20 text-pixel-olive pixel-shadow-sm hover:bg-pixel-olive/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
