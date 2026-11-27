import * as React from "react";
import { cn } from "@/lib/cn";

export function Input({ className, type = "text", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "body h-11 w-full min-w-0 rounded-md border border-line-control bg-surface px-3 text-ink md:h-9",
        "placeholder:text-ink-subtle",
        "read-only:bg-surface-sunken",
        "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-subtle",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("label text-ink-muted", className)} {...props} />;
}
