import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: pixel-press effect via active:translate + active:shadow-none
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold cursor-pointer transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-x-[2px] active:translate-y-[2px]",
  {
    variants: {
      variant: {
        // Primary — golden, hard pixel shadow
        default:
          "rounded-md bg-primary text-primary-foreground pixel-shadow-gold hover:brightness-105 active:shadow-none",
        // Destructive — warm red pixel shadow
        destructive:
          "rounded-md bg-destructive text-destructive-foreground pixel-shadow hover:brightness-105 active:shadow-none",
        // Outlined — pixel border, no fill
        outline:
          "rounded-md border-2 border-primary/40 bg-transparent text-foreground pixel-shadow hover:border-primary/70 hover:bg-primary/10 active:shadow-none",
        // Secondary — coffee-brown fill
        secondary:
          "rounded-md bg-secondary text-secondary-foreground pixel-shadow hover:brightness-110 active:shadow-none",
        // Ghost — no border, subtle hover
        ghost:
          "rounded-md hover:bg-primary/12 hover:text-primary",
        // Link — text only
        link:
          "text-primary underline-offset-4 hover:underline",
        // Cozy — dusty pink accent variant
        cozy:
          "rounded-md bg-accent text-accent-foreground pixel-shadow-pink hover:brightness-105 active:shadow-none",
        // Olive — soft olive accent variant
        olive:
          "rounded-md bg-pixel-olive text-foreground pixel-shadow hover:brightness-105 active:shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 px-3 text-xs",
        lg:      "h-10 px-8 text-base",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
