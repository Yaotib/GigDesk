import { z } from "zod";
import { assertPesewas, formatGHS, percentOf, sum, type Pesewas } from "../money";
import { lineupIdSchema, type Settings } from "../settings/schema";

const halfHours = z.number().min(0).max(24).refine((h) => Number.isInteger(h * 2), "Hours go in steps of 0.5");
const reason = z.string().trim().min(3, "A reason is required");

export const manualLineSchema = z.object({
  description: z.string().trim().min(1),
  amount: z.number().int(),
  reason,
});

export const pricingInputSchema = z.object({
  lineupId: lineupIdSchema,
  hours: halfHours,
  audience: z.number().int().min(0),
  venueHasSound: z.boolean(),
  location: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("accra"), zone: z.enum(["A", "B", "C"]) }),
    z.object({ kind: z.literal("outside"), kmOneWay: z.number().int().min(0).max(2000) }),
  ]),
  nights: z.number().int().min(0).default(0),
  perDiemDays: z.number().int().min(0).default(0),
  generator: z.boolean().default(false),
  backlineIds: z.array(z.string()).default([]),
  manualLines: z.array(manualLineSchema.extend({ amount: z.number().int().nonnegative() })).default([]),
  adjustments: z.array(manualLineSchema).default([]),
  /** Overrides settings.taxes (used by tests and per-quote decisions). */
  taxes: z
    .array(z.object({ id: z.string(), name: z.string(), bp: z.number().int().min(0).max(10000) }))
    .optional(),
  /** Overrides settings.deposit for this quote. */
  deposit: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("percent"), bp: z.number().int().min(0).max(10000) }),
      z.object({ type: z.literal("fixed"), amount: z.number().int().nonnegative() }),
    ])
    .optional(),
  eventDate: z.iso.date().optional(),
  issueDate: z.iso.date().optional(),
});
export type PricingInput = z.input<typeof pricingInputSchema>;

export type QuoteLine = {
  ruleId: string;
  label: string;
  quantity: number;
  unit: string;
  rate: Pesewas;
  amount: Pesewas;
  trace: string;
  reason?: string;
};

export type TaxResult = { ruleId: string; name: string; bp: number; amount: Pesewas; trace: string };

export type PricingResult = {
  lines: QuoteLine[];
  subtotal: Pesewas;
  taxes: TaxResult[];
  total: Pesewas;
  deposit: Pesewas;
  depositTrace: string;
  balance: Pesewas;
  balanceDueDate: string | null;
  validUntil: string | null;
  travelParty: number;
};

const g = (p: Pesewas) => formatGHS(p);

export function price(rawInput: PricingInput, settings: Settings): PricingResult {
  const input = pricingInputSchema.parse(rawInput);
  const lineup = settings.lineups.find((l) => l.id === input.lineupId);
  if (!lineup) throw new Error(`Lineup ${input.lineupId} is not in settings`);
  const r = settings.rates;
  const performers = 1 + lineup.musicians;
  const travelParty = performers + settings.crewTravelling;
  const lines: QuoteLine[] = [];
  const add = (l: QuoteLine) => lines.push({ ...l, amount: assertPesewas(l.amount, l.label) });

  add({ ruleId: "R-01", label: "Artist fee", quantity: 1, unit: "gig", rate: lineup.artistFee, amount: lineup.artistFee, trace: `${lineup.name} artist fee` });

  add({
    ruleId: "R-02", label: "Musician fees", quantity: lineup.musicians, unit: "musician", rate: lineup.musicianFee,
    amount: lineup.musicians * lineup.musicianFee,
    trace: `${lineup.musicians} musicians × ${g(lineup.musicianFee)}`,
  });

  const extra = Math.max(0, input.hours - lineup.includedHours);
  if (extra > 0) {
    add({
      ruleId: "R-03", label: "Extra hours", quantity: extra * performers, unit: "person-hour", rate: lineup.extraHourPerPerson,
      amount: halfUp(extra * 2 * performers * lineup.extraHourPerPerson),
      trace: `${extra} h × ${g(lineup.extraHourPerPerson)} × ${performers} performers (${input.hours} h booked, ${lineup.includedHours} h included)`,
    });
  }

  if (lineup.rehearsalHours > 0 && lineup.musicians > 0) {
    add({
      ruleId: "R-04", label: "Rehearsal", quantity: lineup.rehearsalHours * lineup.musicians, unit: "musician-hour", rate: r.rehearsalPerMusicianHour,
      amount: halfUp(lineup.rehearsalHours * 2 * r.rehearsalPerMusicianHour * lineup.musicians),
      trace: `${lineup.rehearsalHours} h × ${g(r.rehearsalPerMusicianHour)} × ${lineup.musicians} musicians`,
    });
  }

  if (!input.venueHasSound) {
    const tier = input.audience <= r.audienceTiers.smallMax ? "small" : input.audience <= r.audienceTiers.mediumMax ? "medium" : "large";
    add({ ruleId: "R-05", label: `PA system (${tier})`, quantity: 1, unit: "event", rate: r.pa[tier], amount: r.pa[tier], trace: `${input.audience} guests → ${tier} tier; venue has no sound` });
  }

  add({ ruleId: "R-06", label: "Sound engineer", quantity: 1, unit: "event", rate: r.engineer, amount: r.engineer, trace: "Band engineer, every event" });

  if (input.location.kind === "accra") {
    const rate = r.transportZones[input.location.zone];
    add({ ruleId: "R-07", label: "Transport", quantity: lineup.vehicles, unit: "vehicle", rate, amount: rate * lineup.vehicles, trace: `Accra zone ${input.location.zone}: ${g(rate)} × ${lineup.vehicles} vehicle(s)` });
  } else {
    const km = input.location.kmOneWay;
    add({ ruleId: "R-07", label: "Transport", quantity: km * 2 * lineup.vehicles, unit: "vehicle-km", rate: r.perKm, amount: km * 2 * r.perKm * lineup.vehicles, trace: `${km} km × 2 × ${g(r.perKm)} × ${lineup.vehicles} vehicle(s)` });
  }

  if (input.nights > 0) {
    add({ ruleId: "R-08", label: "Accommodation", quantity: travelParty * input.nights, unit: "person-night", rate: r.accommodationPerPersonNight, amount: travelParty * input.nights * r.accommodationPerPersonNight, trace: `${travelParty} people × ${input.nights} night(s) × ${g(r.accommodationPerPersonNight)}` });
  }

  if (input.perDiemDays > 0) {
    add({ ruleId: "R-09", label: "Per diem", quantity: travelParty * input.perDiemDays, unit: "person-day", rate: r.perDiemPerPersonDay, amount: travelParty * input.perDiemDays * r.perDiemPerPersonDay, trace: `${travelParty} people × ${input.perDiemDays} day(s) × ${g(r.perDiemPerPersonDay)}` });
  }

  if (input.generator) {
    add({ ruleId: "R-10", label: "Generator", quantity: 1, unit: "event", rate: r.generator, amount: r.generator, trace: "Generator hire" });
  }

  for (const id of input.backlineIds) {
    const item = r.backline.find((b) => b.id === id);
    if (!item) throw new Error(`Backline item ${id} is not in settings`);
    add({ ruleId: "R-11", label: `Backline: ${item.name}`, quantity: 1, unit: "item", rate: item.amount, amount: item.amount, trace: "Backline hire" });
  }

  input.manualLines.forEach((m, i) =>
    add({ ruleId: `M-${String(i + 1).padStart(2, "0")}`, label: m.description, quantity: 1, unit: "item", rate: m.amount, amount: m.amount, trace: m.reason, reason: m.reason }),
  );
  input.adjustments.forEach((a, i) =>
    add({ ruleId: `A-${String(i + 1).padStart(2, "0")}`, label: a.description, quantity: 1, unit: "item", rate: a.amount, amount: a.amount, trace: a.reason, reason: a.reason }),
  );

  const subtotal = sum(lines.map((l) => l.amount));
  if (subtotal < 0) throw new Error("Adjustments cannot take the subtotal below zero");

  const taxDefs = input.taxes ?? settings.taxes.filter((t) => t.enabled);
  const taxes: TaxResult[] = taxDefs.map((t, i) => ({
    ruleId: `T-${String(i + 1).padStart(2, "0")}`,
    name: t.name,
    bp: t.bp,
    amount: percentOf(subtotal, t.bp),
    trace: `${t.bp / 100}% of ${g(subtotal)}`,
  }));
  const total = sum([subtotal, ...taxes.map((t) => t.amount)]);

  const rule = input.deposit ?? settings.deposit;
  const deposit = rule.type === "percent" ? percentOf(total, rule.bp) : Math.min(rule.amount, total);
  const depositTrace =
    rule.type === "percent"
      ? `${rule.bp / 100}% of ${g(total)}, rounded half-up`
      : rule.amount > total
        ? `Fixed ${g(rule.amount)}, capped at the total`
        : `Fixed ${g(rule.amount)}`;
  const balance = total - deposit;

  return {
    lines,
    subtotal,
    taxes,
    total,
    deposit,
    depositTrace,
    balance,
    balanceDueDate: input.eventDate ? addDays(input.eventDate, -settings.balanceDueDaysBefore) : null,
    validUntil: input.issueDate ? addDays(input.issueDate, settings.quoteValidityDays) : null,
    travelParty,
  };
}

/** YYYY-MM-DD ± days. Africa/Accra is UTC+0 with no DST, so UTC date maths is exact. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Halve a whole number of half-pesewas, rounding half-up. */
function halfUp(doubled: number): Pesewas {
  return Math.floor((Math.round(doubled) + 1) / 2);
}
