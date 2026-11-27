import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Design system Button. Primary (lime) is used at most once per view.
 * 44px on mobile, 36px from 768px. Radius 6px, never a pill.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4",
    "body-strong cursor-pointer select-none transition-colors",
    "h-11 md:h-9",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-ink-subtle",
    "aria-disabled:cursor-not-allowed aria-disabled:border-line aria-disabled:bg-surface-sunken aria-disabled:text-ink-subtle",
  ],
  {
    variants: {
      variant: {
        primary: "border-accent bg-accent text-on-accent hover:border-accent-hover hover:bg-accent-hover",
        default: "border-line-control bg-surface text-ink hover:bg-surface-sunken",
        ghost: "border-transparent bg-transparent text-ink hover:bg-surface-sunken",
        danger: "border-transparent bg-transparent text-danger hover:bg-danger-soft",
      },
      size: {
        default: "",
        lg: "h-11 md:h-11",
        sm: "h-11 px-3 md:h-8",
        icon: "size-11 px-0 md:size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
}
