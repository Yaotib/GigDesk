import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the token type classes so they merge like font-size utilities.
const twMerge = extendTailwindMerge<"gd-type">({
  extend: {
    classGroups: {
      "gd-type": [
        "page-title",
        "section-title",
        "body",
        "body-strong",
        "small",
        "label",
        "figure",
        "figure-total",
        "step-number",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
