import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { parseEmailList } = await import("@/server/env");

describe("parseEmailList", () => {
  it("trims, lowercases and de-duplicates", () => {
    expect(parseEmailList(" Susan@Example.com, band@example.com ,susan@example.com,, ")).toEqual([
      "susan@example.com",
      "band@example.com",
    ]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseEmailList(undefined)).toEqual([]);
    expect(parseEmailList("")).toEqual([]);
  });
});
