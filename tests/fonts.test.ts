import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const fontkit = require("@react-pdf/fontkit") as { default: { create(buf: Buffer): { hasGlyphForCodePoint(cp: number): boolean } } };

const CEDI = 0x20b5;
const geistDir = join(__dirname, "..", "node_modules", "geist", "dist", "fonts");
const open = (file: string) => fontkit.default.create(readFileSync(join(geistDir, file)));

describe("fonts", () => {
  // Records a fact the app depends on: Geist cannot draw ₵, so a fallback font must.
  it.each(["geist-sans/Geist-Regular.ttf", "geist-mono/GeistMono-Regular.ttf"])("%s has no ₵ glyph", (file) => {
    expect(open(file).hasGlyphForCodePoint(CEDI)).toBe(false);
  });

  it.each(["geist-sans/Geist-Regular.ttf", "geist-mono/GeistMono-Regular.ttf"])("%s has the other glyphs we print", (file) => {
    const font = open(file);
    for (const ch of "0123456789,.×–·GHS") expect(font.hasGlyphForCodePoint(ch.codePointAt(0)!)).toBe(true);
  });
});
