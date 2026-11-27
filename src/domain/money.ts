/**
 * Money is integer pesewas (GH₵1 = 100). Percentages are basis points (5% = 500).
 * Rounding is half-up (away from zero on .5). No floats in money paths.
 */
export type Pesewas = number;

export function assertPesewas(value: number, label = "amount"): Pesewas {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be a whole number of pesewas, got ${value}`);
  return value;
}

/** Whole cedis → pesewas. For settings and tests written in cedis. */
export function cedis(amount: number): Pesewas {
  return assertPesewas(Math.round(amount * 100), "cedis");
}

/** round-half-up(amount × bp / 10000), computed with BigInt so it is exact. */
export function percentOf(amount: Pesewas, bp: number): Pesewas {
  assertPesewas(amount);
  if (!Number.isInteger(bp) || bp < 0) throw new Error(`basis points must be a non-negative integer, got ${bp}`);
  const q = BigInt(amount) * BigInt(bp);
  const abs = q < 0n ? -q : q;
  const rounded = (abs + 5000n) / 10000n;
  return Number(q < 0n ? -rounded : rounded);
}

export function sum(values: Pesewas[]): Pesewas {
  return assertPesewas(values.reduce((a, b) => a + b, 0), "sum");
}

/** GH₵12,450.00 · negatives get a leading minus: -GH₵50.00 */
export function formatGHS(amount: Pesewas, symbol = "GH₵"): string {
  assertPesewas(amount);
  const abs = Math.abs(amount);
  const whole = Math.floor(abs / 100).toLocaleString("en-US");
  const frac = String(abs % 100).padStart(2, "0");
  return `${amount < 0 ? "-" : ""}${symbol}${whole}.${frac}`;
}

/** 14250 cedis → "14,250.00" (no symbol), for tables and traces. */
export function formatAmount(amount: Pesewas): string {
  return formatGHS(amount, "");
}
