// Which signals HALO tracks, which direction is "bad", and which NASA hazard (RIDGE) each belongs to.
// badDirection: +1 = rising is bad, -1 = falling is bad, 0 = both directions are bad.
// minSd stops a very steady signal from turning tiny noise into a big drift score (DEMO values).

export type Hazard = "Radiation" | "Isolation" | "Distance" | "Gravity" | "Environment";

export type SignalDef = {
  key: string;
  label: string;
  unit: string;
  badDirection: 1 | -1 | 0;
  minSd: number;
  hazard: Hazard;
  bodyPart: "head" | "eyes" | "heart" | "lungs" | "kidneys" | "bones" | "muscles" | "gut" | "whole_body" | "mind";
  // Expected change per day that EVERY astronaut gets in flight, from published rates.
  // HALO measures drift against this expected path, so normal spaceflight decline is not an alarm —
  // only declining FASTER than the research predicts is. ("Physics + ML": known rates are the backbone.)
  expectedPerDay?: number; // in signal units
  expectedPctPerDay?: number; // as % of the person's baseline
};

export const SIGNALS: SignalDef[] = [
  { key: "heart_rate", label: "Resting heart rate", unit: "bpm", badDirection: 0, minSd: 2, hazard: "Gravity", bodyPart: "heart" },
  { key: "bp_sys", label: "Systolic blood pressure", unit: "mmHg", badDirection: 0, minSd: 4, hazard: "Gravity", bodyPart: "heart" },
  { key: "bp_dia", label: "Diastolic blood pressure", unit: "mmHg", badDirection: 0, minSd: 3, hazard: "Gravity", bodyPart: "heart" },
  { key: "temp_c", label: "Body temperature", unit: "°C", badDirection: 1, minSd: 0.15, hazard: "Environment", bodyPart: "whole_body" },
  { key: "spo2", label: "Blood oxygen (SpO2)", unit: "%", badDirection: -1, minSd: 0.7, hazard: "Environment", bodyPart: "lungs" },
  { key: "glucose_mg_dl", label: "Blood sugar", unit: "mg/dL", badDirection: 0, minSd: 6, hazard: "Environment", bodyPart: "gut" },
  { key: "sleep_hours", label: "Sleep", unit: "h", badDirection: -1, minSd: 0.5, hazard: "Isolation", bodyPart: "mind" },
  { key: "sleep_debt_h", label: "Sleep debt", unit: "h", badDirection: 1, minSd: 0.8, hazard: "Isolation", bodyPart: "mind" },
  { key: "mood_1to5", label: "Mood", unit: "/5", badDirection: -1, minSd: 0.5, hazard: "Isolation", bodyPart: "mind" },
  { key: "stress_1to5", label: "Stress", unit: "/5", badDirection: 1, minSd: 0.5, hazard: "Isolation", bodyPart: "mind" },
  { key: "fluid_intake_ml", label: "Fluid intake", unit: "ml", badDirection: -1, minSd: 150, hazard: "Gravity", bodyPart: "kidneys" },
  { key: "urine_color_1to8", label: "Urine colour", unit: "/8", badDirection: 1, minSd: 0.6, hazard: "Gravity", bodyPart: "kidneys" },
  { key: "sodium_mg", label: "Sodium intake", unit: "mg", badDirection: 1, minSd: 250, hazard: "Environment", bodyPart: "kidneys" },
  { key: "bone_density_pct", label: "Bone density", unit: "% of pre-flight", badDirection: -1, minSd: 0.3, hazard: "Gravity", bodyPart: "bones", expectedPerDay: -0.037 }, // ~1.1%/month with daily exercise (NASA)
  { key: "bone_resorption_index", label: "Bone breakdown marker", unit: "index", badDirection: 1, minSd: 5, hazard: "Gravity", bodyPart: "bones", expectedPerDay: 0.66 }, // tracks the expected bone loss
  { key: "calf_volume_pct", label: "Calf muscle volume", unit: "% of pre-flight", badDirection: -1, minSd: 0.3, hazard: "Gravity", bodyPart: "muscles", expectedPerDay: -0.064 }, // -13% / 6 months (Trappe)
  { key: "exercise_min", label: "Exercise", unit: "min", badDirection: -1, minSd: 15, hazard: "Gravity", bodyPart: "muscles" },
  { key: "body_mass_kg", label: "Body mass", unit: "kg", badDirection: -1, minSd: 0.3, hazard: "Environment", bodyPart: "whole_body", expectedPctPerDay: -0.05 }, // eating ~80% of need (Smith)
  { key: "kcal_eaten", label: "Calories eaten", unit: "kcal", badDirection: -1, minSd: 120, hazard: "Environment", bodyPart: "gut" },
  { key: "vitamin_d_ng_ml", label: "Vitamin D", unit: "ng/mL", badDirection: -1, minSd: 0.5, hazard: "Environment", bodyPart: "bones", expectedPerDay: -0.08 }, // no UV in a spacecraft (DEMO rate)
  { key: "radiation_mSv_today", label: "Radiation today", unit: "mSv", badDirection: 1, minSd: 0.1, hazard: "Radiation", bodyPart: "whole_body" },
  { key: "reaction_time_ms", label: "Reaction time", unit: "ms", badDirection: 1, minSd: 10, hazard: "Isolation", bodyPart: "mind" },
  { key: "memory_score", label: "Memory test", unit: "/100", badDirection: -1, minSd: 3, hazard: "Isolation", bodyPart: "mind" },
];

export const SIGNAL_BY_KEY: Record<string, SignalDef> = Object.fromEntries(SIGNALS.map((s) => [s.key, s]));
