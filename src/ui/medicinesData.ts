// MOCK: schedule is the same for every crew member. Set by the flight surgeon; HALO never changes it.
export const SET_ON_DAY = 50;

export type Med = { id: string; time: string; name: string; how: string; status: "Taken" | "Due" | "As needed" };
export const TODAY: Med[] = [
  { id: "d3", time: "08:00", name: "Vitamin D3", how: "Morning, with breakfast", status: "Taken" },
  { id: "mel", time: "21:30", name: "Melatonin", how: "Before sleep, as prescribed", status: "Due" },
  { id: "anti", time: "As needed", name: "Antihistamine", how: "Only if symptoms", status: "As needed" },
];

// MOCK: last 7 days. "pending" is today, not yet taken.
export type DoseState = "taken" | "missed" | "pending";
export const WEEK_DAYS = [52, 53, 54, 55, 56, 57, 58];
export const WEEK: { name: string; doses: DoseState[] }[] = [
  { name: "Vitamin D3", doses: ["taken", "taken", "missed", "taken", "taken", "taken", "taken"] },
  { name: "Melatonin", doses: ["taken", "taken", "taken", "taken", "taken", "taken", "pending"] },
];

// DEMO rule: strength = 100 - k * daysStowed - r * radiationTotal / 100, clamped 0-100.
// Shaped by Du et al. 2011. Not a lab measurement.
export const PACKED_DAYS_BEFORE_LAUNCH = 90;
export const POTENCY: { name: string; k: number; r: number }[] = [
  { name: "Amoxicillin", k: 0.012, r: 0.9 },
  { name: "Ibuprofen", k: 0.006, r: 0.4 },
  { name: "Promethazine", k: 0.015, r: 1.1 },
  { name: "Melatonin", k: 0.008, r: 0.5 },
  { name: "Epinephrine auto-injector", k: 0.02, r: 1.3 },
  { name: "Vitamin D3", k: 0.004, r: 0.3 },
];
// DEMO: future dose accrues at the Mars-cruise rate (MSL RAD, 1.8 mSv per day).
export const DOSE_PER_DAY = 1.8;
export const HORIZON_DAY = 900; // roughly a Mars round trip
/** First mission day on which strength falls below 90%, or null if it lasts the horizon. */
export function below90Day(k: number, r: number, day: number, radiationTotal: number): number | null {
  for (let d = day; d <= HORIZON_DAY; d++) {
    if (strengthOf(k, r, d + PACKED_DAYS_BEFORE_LAUNCH, radiationTotal + DOSE_PER_DAY * (d - day)) < 90) return d;
  }
  return null;
}
export const strengthOf = (k: number, r: number, daysStowed: number, radiationTotal: number) =>
  Math.round(Math.min(100, Math.max(0, 100 - k * daysStowed - (r * radiationTotal) / 100)));
