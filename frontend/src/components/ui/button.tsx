import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground soft-shadow hover:soft-shadow-lg hover:from-primary/90 hover:to-primary/70",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground soft-shadow hover:soft-shadow-lg hover:from-destructive/90 hover:to-destructive/70",
        outline:
          "border-2 border-primary/20 bg-background/80 backdrop-blur-sm soft-shadow hover:bg-primary/5 hover:border-primary/40 hover:soft-shadow-lg",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground soft-shadow hover:soft-shadow-lg hover:from-secondary/90 hover:to-secondary/70",
        ghost: "hover:bg-primary/10 hover:text-primary-foreground rounded-2xl",
        link: "text-primary underline-offset-4 hover:underline rounded-2xl",
        accent:
          "bg-gradient-to-r from-accent to-accent/80 text-accent-foreground soft-shadow hover:soft-shadow-lg hover:from-accent/90 hover:to-accent/70",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base",
        xl: "h-16 rounded-3xl px-12 text-lg",
        icon: "h-11 w-11 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
