import { cedis } from "../money";
import { settingsSchema, type Settings } from "./schema";

/**
 * SAMPLE settings from the build brief. Placeholders only: every value must be
 * replaced with figures confirmed by Susan's team and accountant before real use.
 */
export const SAMPLE_SETTINGS: Settings = settingsSchema.parse({
  sample: true,
  currency: "GHS",
  lineups: [
    { id: "duo", name: "Duo", musicians: 1, artistFee: cedis(3000), musicianFee: cedis(1200), includedHours: 3, extraHourPerPerson: cedis(300), rehearsalHours: 2, vehicles: 1 },
    { id: "quartet", name: "Quartet", musicians: 3, artistFee: cedis(4000), musicianFee: cedis(1500), includedHours: 3, extraHourPerPerson: cedis(350), rehearsalHours: 3, vehicles: 1 },
    { id: "full", name: "Full band", musicians: 10, artistFee: cedis(6000), musicianFee: cedis(1500), includedHours: 3, extraHourPerPerson: cedis(350), rehearsalHours: 4, vehicles: 3 },
  ],
  rates: {
    rehearsalPerMusicianHour: cedis(150),
    pa: { small: cedis(1500), medium: cedis(3000), large: cedis(6000) },
    audienceTiers: { smallMax: 100, mediumMax: 300 },
    engineer: cedis(800),
    transportZones: { A: cedis(400), B: cedis(600), C: cedis(900) },
    perKm: cedis(10),
    accommodationPerPersonNight: cedis(600),
    perDiemPerPersonDay: cedis(200),
    generator: cedis(1500),
    backline: [],
  },
  crewTravelling: 1,
  taxes: [],
  deposit: { type: "percent", bp: 5000 },
  balanceDueDaysBefore: 7,
  quoteValidityDays: 14,
});
