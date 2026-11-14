// Pharmacy potency tracker: forecasts which onboard medicines are losing strength.
//
// Evidence: Du et al. 2011 — after 880 days in orbit only 31% of drug formulations still met
// potency spec, vs 54% of matched ground controls; the extra loss is likely radiation-driven.
//
// Model (DEMO): potency = 100% x exp(-(k_shelf x days_since_made + k_rad x dose_mSv))
//   k_shelf: each drug's normal shelf-life decay (set so it hits 90% at its labelled expiry)
//   k_rad:   extra loss per mSv, scaled by how radiation-sensitive the molecule is
// "Below spec" = under 90% of labelled strength (the usual pharmacopeia limit).
// Never use this to change a dose — HALO only flags; the flight surgeon decides.

export type Medicine = {
  name: string;
  use: string;
  shelfLifeDays: number; // labelled shelf life on Earth
  daysStowedPreflight: number; // age at launch
  radSensitivity: number; // 0 (stable) .. 1 (fragile) — DEMO
};

export const KIT: Medicine[] = [
  { name: "Ibuprofen 400 mg", use: "pain / inflammation", shelfLifeDays: 1460, daysStowedPreflight: 300, radSensitivity: 0.2 },
  { name: "Acetaminophen 500 mg", use: "pain / fever", shelfLifeDays: 1095, daysStowedPreflight: 360, radSensitivity: 0.3 },
  { name: "Promethazine 25 mg", use: "space motion sickness", shelfLifeDays: 730, daysStowedPreflight: 250, radSensitivity: 0.8 },
  { name: "Zolpidem 5 mg", use: "sleep", shelfLifeDays: 1095, daysStowedPreflight: 200, radSensitivity: 0.4 },
  { name: "Amoxicillin-clavulanate", use: "bacterial infection", shelfLifeDays: 730, daysStowedPreflight: 320, radSensitivity: 1.0 },
  { name: "Loratadine 10 mg", use: "allergy", shelfLifeDays: 1095, daysStowedPreflight: 180, radSensitivity: 0.2 },
  { name: "Epinephrine auto-injector", use: "anaphylaxis", shelfLifeDays: 540, daysStowedPreflight: 120, radSensitivity: 0.9 },
  { name: "Ciprofloxacin 500 mg", use: "bacterial infection", shelfLifeDays: 1095, daysStowedPreflight: 400, radSensitivity: 0.6 },
];

const K_RAD_PER_MSV = 0.00045; // DEMO: fully sensitive drug loses ~10% extra over a ~240 mSv Mars transit

export type PotencyForecast = {
  name: string;
  use: string;
  potencyPct: number;
  status: "OK" | "Watch" | "Replace";
  belowSpecOnDay: number | null; // mission day it dropped (or will drop) under 90%; null if not within 2 more years
};

export function potencyAt(m: Medicine, missionDay: number, doseMSv: number): number {
  const kShelf = -Math.log(0.9) / m.shelfLifeDays;
  return 100 * Math.exp(-(kShelf * (m.daysStowedPreflight + missionDay) + K_RAD_PER_MSV * m.radSensitivity * doseMSv));
}

/** missionDay: today; doseSoFar: cumulative mSv so far; dailyDose: expected mSv/day from here on */
export function forecastPotency(missionDay: number, doseSoFar: number, dailyDose = 1.8, kit = KIT): PotencyForecast[] {
  return kit
    .map((m) => {
      const p = potencyAt(m, missionDay, doseSoFar);
      // Walk from launch: past days use the dose actually received (spread evenly), future days the expected rate
      const doseOn = (day: number) =>
        day <= missionDay ? (missionDay === 0 ? 0 : (doseSoFar * day) / missionDay) : doseSoFar + dailyDose * (day - missionDay);
      let belowSpecOnDay: number | null = null;
      for (let day = 0; day <= missionDay + 730; day++) {
        if (potencyAt(m, day, doseOn(day)) < 90) {
          belowSpecOnDay = day;
          break;
        }
      }
      const status: PotencyForecast["status"] = p < 90 ? "Replace" : p < 93 ? "Watch" : "OK";
      return { name: m.name, use: m.use, potencyPct: Math.round(p * 10) / 10, status, belowSpecOnDay };
    })
    .sort((a, b) => a.potencyPct - b.potencyPct);
}
