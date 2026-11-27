import { z } from "zod";

const pesewas = z.number().int().nonnegative();
const bp = z.number().int().min(0).max(10000);

export const LINEUP_IDS = ["duo", "quartet", "full"] as const;
export const lineupIdSchema = z.enum(LINEUP_IDS);
export type LineupId = z.infer<typeof lineupIdSchema>;

export const lineupSchema = z.object({
  id: lineupIdSchema,
  name: z.string().min(1),
  /** Musicians besides the artist. Pieces = 1 + musicians. */
  musicians: z.number().int().min(0),
  artistFee: pesewas,
  musicianFee: pesewas,
  includedHours: z.number().min(0),
  extraHourPerPerson: pesewas,
  rehearsalHours: z.number().min(0),
  vehicles: z.number().int().min(0),
});
export type Lineup = z.infer<typeof lineupSchema>;

export const taxLineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  bp,
  enabled: z.boolean(),
  /** Shown on quotes until the accountant confirms the line. */
  confirmed: z.boolean().default(false),
});

export const backlineItemSchema = z.object({ id: z.string().min(1), name: z.string().min(1), amount: pesewas });

export const depositRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("percent"), bp }),
  z.object({ type: z.literal("fixed"), amount: pesewas }),
]);
export type DepositRule = z.infer<typeof depositRuleSchema>;

export const settingsSchema = z.object({
  /** True while any value is a SAMPLE placeholder. */
  sample: z.boolean(),
  currency: z.literal("GHS"),
  lineups: z.array(lineupSchema).length(3),
  rates: z.object({
    rehearsalPerMusicianHour: pesewas,
    pa: z.object({ small: pesewas, medium: pesewas, large: pesewas }),
    /** Audience at or below smallMax → small; at or below mediumMax → medium; else large. */
    audienceTiers: z.object({ smallMax: z.number().int().min(0), mediumMax: z.number().int().min(0) }),
    engineer: pesewas,
    transportZones: z.object({ A: pesewas, B: pesewas, C: pesewas }),
    perKm: pesewas,
    accommodationPerPersonNight: pesewas,
    perDiemPerPersonDay: pesewas,
    generator: pesewas,
    backline: z.array(backlineItemSchema),
  }),
  /** People who travel besides performers (the band's engineer). */
  crewTravelling: z.number().int().min(0),
  taxes: z.array(taxLineSchema),
  deposit: depositRuleSchema,
  balanceDueDaysBefore: z.number().int().min(0),
  quoteValidityDays: z.number().int().min(1),
});
export type Settings = z.infer<typeof settingsSchema>;
export type TaxLine = z.infer<typeof taxLineSchema>;
