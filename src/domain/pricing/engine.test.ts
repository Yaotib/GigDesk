import { describe, expect, it } from "vitest";
import { cedis, formatGHS, percentOf } from "../money";
import { SAMPLE_SETTINGS } from "../settings/sample";
import { price, type PricingInput } from "./engine";

const S1: PricingInput = {
  lineupId: "quartet",
  hours: 3,
  audience: 120,
  venueHasSound: false,
  location: { kind: "accra", zone: "B" },
};

describe("money", () => {
  it("rounds half-up", () => {
    expect(percentOf(1531875, 5000)).toBe(765938); // 7,659.375 → 7,659.38
    expect(percentOf(1, 5000)).toBe(1); // 0.5 pesewa → 1
    expect(percentOf(-1, 5000)).toBe(-1);
  });
  it("formats cedis", () => {
    expect(formatGHS(cedis(12450))).toBe("GH₵12,450.00");
    expect(formatGHS(-5000)).toBe("-GH₵50.00");
  });
});

describe("pricing engine — required exact tests", () => {
  it("S1: quartet, zone B, no venue sound, 120 guests, 3 h", () => {
    const r = price(S1, SAMPLE_SETTINGS);
    expect(r.subtotal).toBe(cedis(14250));
    expect(r.deposit).toBe(cedis(7125));
    expect(r.balance).toBe(cedis(7125));
    expect(r.lines.map((l) => l.ruleId)).toEqual(["R-01", "R-02", "R-04", "R-05", "R-06", "R-07"]);
  });

  it("S2: S1 + test-only taxes 5% and 2.5%", () => {
    const r = price(
      { ...S1, taxes: [{ id: "t1", name: "Test tax A", bp: 500 }, { id: "t2", name: "Test tax B", bp: 250 }] },
      SAMPLE_SETTINGS,
    );
    expect(r.taxes.reduce((a, t) => a + t.amount, 0)).toBe(106875);
    expect(r.total).toBe(1531875);
    expect(r.deposit).toBe(765938);
    expect(r.balance).toBe(765937);
  });

  it("S3: S1 with 4 h", () => {
    const r = price({ ...S1, hours: 4 }, SAMPLE_SETTINGS);
    expect(r.lines.find((l) => l.ruleId === "R-03")?.amount).toBe(cedis(1400));
    expect(r.subtotal).toBe(cedis(15650));
  });

  it("S4: full band, 250 km one way, 1 night, 2 per-diem days, venue has sound", () => {
    const r = price(
      { lineupId: "full", hours: 3, audience: 300, venueHasSound: true, location: { kind: "outside", kmOneWay: 250 }, nights: 1, perDiemDays: 2 },
      SAMPLE_SETTINGS,
    );
    expect(r.subtotal).toBe(cedis(54800));
    expect(r.travelParty).toBe(12);
    expect(r.lines.some((l) => l.ruleId === "R-05")).toBe(false);
  });
});

describe("pricing engine — guards", () => {
  it("rejects a manual line without a reason", () => {
    expect(() => price({ ...S1, manualLines: [{ description: "Extra mic", amount: 5000, reason: "" }] }, SAMPLE_SETTINGS)).toThrow();
    expect(() => price({ ...S1, adjustments: [{ description: "Goodwill", amount: -5000, reason: "  " }] }, SAMPLE_SETTINGS)).toThrow();
  });

  it("accepts a manual line with a reason and traces it", () => {
    const r = price({ ...S1, manualLines: [{ description: "Extra mic", amount: cedis(50), reason: "Client asked for a choir mic" }] }, SAMPLE_SETTINGS);
    expect(r.subtotal).toBe(cedis(14300));
    expect(r.lines.at(-1)).toMatchObject({ ruleId: "M-01", reason: "Client asked for a choir mic" });
  });

  it("caps a fixed deposit larger than the total", () => {
    const r = price({ ...S1, deposit: { type: "fixed", amount: cedis(99999) } }, SAMPLE_SETTINGS);
    expect(r.deposit).toBe(r.total);
    expect(r.balance).toBe(0);
  });

  it("deposit + balance = total across 200 generated cases", () => {
    let seed = 42;
    const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) % 2 ** 31), seed % n);
    const lineups = ["duo", "quartet", "full"] as const;
    for (let i = 0; i < 200; i++) {
      const r = price(
        {
          lineupId: lineups[rnd(3)]!,
          hours: rnd(13) / 2 + 1,
          audience: rnd(600),
          venueHasSound: rnd(2) === 0,
          location: rnd(2) === 0 ? { kind: "accra", zone: (["A", "B", "C"] as const)[rnd(3)]! } : { kind: "outside", kmOneWay: rnd(700) },
          nights: rnd(3),
          perDiemDays: rnd(4),
          generator: rnd(2) === 0,
          manualLines: rnd(2) ? [{ description: "Item", amount: rnd(100000), reason: "Generated case" }] : [],
          taxes: rnd(2) ? [{ id: "t", name: "Tax", bp: rnd(2000) }] : [],
          deposit: rnd(3) === 0 ? { type: "fixed", amount: rnd(10_000_000) } : { type: "percent", bp: rnd(10001) },
        },
        SAMPLE_SETTINGS,
      );
      expect(Number.isSafeInteger(r.total)).toBe(true);
      expect(r.deposit + r.balance).toBe(r.total);
      expect(r.deposit).toBeGreaterThanOrEqual(0);
      expect(r.balance).toBeGreaterThanOrEqual(0);
    }
  });

  it("computes balance due and validity dates", () => {
    const r = price({ ...S1, eventDate: "2026-12-13", issueDate: "2026-11-27" }, SAMPLE_SETTINGS);
    expect(r.balanceDueDate).toBe("2026-12-06");
    expect(r.validUntil).toBe("2026-12-11");
  });
});
