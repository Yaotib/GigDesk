import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const dsDir = join(root, "docs", "GigDesk Design System", "GigDesk Design System");
const normalise = (s: string) => s.replace(/\r\n/g, "\n").trim();

describe("design tokens", () => {
  it("src/styles/tokens.css is an exact copy of the design system tokens.css", () => {
    const source = readFileSync(join(dsDir, "tokens.css"), "utf8");
    const copy = readFileSync(join(root, "src", "styles", "tokens.css"), "utf8");
    expect(normalise(copy)).toBe(normalise(source));
  });

  it("every colour token in tokens.json is mapped into the Tailwind theme", () => {
    const tokens = JSON.parse(readFileSync(join(dsDir, "tokens.json"), "utf8")) as {
      color: { tokens: { name: string }[] };
    };
    const globals = readFileSync(join(root, "src", "styles", "globals.css"), "utf8");
    for (const { name } of tokens.color.tokens) {
      expect(globals, `missing --color-${name}`).toContain(`--color-${name}: var(--${name});`);
    }
  });

  it("radii and shadows in the Tailwind theme match tokens.json", () => {
    const tokens = JSON.parse(readFileSync(join(dsDir, "tokens.json"), "utf8")) as {
      radius: { tokens: { name: string; value: string }[] };
      shadow: { tokens: { name: string; value: string }[] };
    };
    const globals = readFileSync(join(root, "src", "styles", "globals.css"), "utf8").replace(/\s+/g, "");
    for (const t of [...tokens.radius.tokens, ...tokens.shadow.tokens]) {
      expect(globals).toContain(`--${t.name}:${t.value.replace(/\s+/g, "")};`);
    }
  });
});
