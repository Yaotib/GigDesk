import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "docs/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "next-env.d.ts",
      "src/server/db.types.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Design system rule 10: ScanText is the AI icon; Sparkles is banned.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              importNames: ["Sparkles", "SparklesIcon", "Sparkle", "SparkleIcon"],
              message: "Use ScanText as the AI icon (design rule 10).",
            },
          ],
        },
      ],
    },
  },
  {
    // The domain layer is pure: no framework, database or AI imports.
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-dom", "next", "next/*"], message: "src/domain must stay pure." },
            { group: ["@supabase/*", "groq-sdk", "@/ai/*", "@/server/*"], message: "src/domain must stay pure." },
          ],
        },
      ],
    },
  },
];

export default config;
