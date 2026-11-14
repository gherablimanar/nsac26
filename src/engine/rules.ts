// The Coupled Risk Engine's starter rules (from the master plan).
// Each rule links several signals into ONE named risk, cites the research behind the link,
// and points to an action card. All thresholds are DEMO parameters.
//
// Gurman: please check/replace the citations and action wording — this is a working starting point.

import type { Drift } from "./baseline.ts";
import type { Level, MissionProfile, Reading } from "./types.ts";

export type RuleInput = {
  day: number;
  today: Reading;
  drift: Record<string, Drift>;
  profile: MissionProfile;
};

export type Contributor = { signal: string; score: number };

export type RiskResult = {
  ruleId: string;
  name: string;
  level: Level;
  score: number; // 0 = nothing going on; 2.5+ = Watch; 4+ = Act
  range: [number, number]; // uncertainty band on the score
  contributors: Contributor[]; // signals that pushed the risk up, biggest first
  action: string; // action card text
  citation: string;
  uncertainty: string[]; // "Why is HALO unsure?" lines
  bodyParts: string[];
};

type CoupledRule = {
  id: string;
  name: string;
  signals: Record<string, number>; // signal -> weight
  needs?: string[]; // signals the rule wants but our data does not have yet
  minActive: number; // how many signals must be drifting together for Watch/Act
  citation: string;
  action: { watch: string; act: string };
  bodyParts: string[];
  custom?: (inp: RuleInput) => { score: number; contributors: Contributor[] } | null;
};

const ACTIVE = 1.5; // a signal counts as "drifting" above this score (DEMO)
const WATCH_AT = 2.5; // DEMO
const ACT_AT = 4; // DEMO

// Normal daily dose by mission profile, mSv/day.
// ISS ~100 mSv per 6 months; Mars cruise 1.8 (MSL RAD); Moon surface ~1.4 (Chang'e 4 LND, DEMO-rounded)
export const NORMAL_DOSE: Record<MissionProfile, number> = { iss: 0.55, moon: 1.4, mars_transit: 1.8 };

export const RULES: CoupledRule[] = [
  {
    id: "kidney_stone",
    name: "Kidney stone risk",
    signals: { bone_resorption_index: 1.2, fluid_intake_ml: 1.2, urine_color_1to8: 1, sodium_mg: 0.6 },
    minActive: 2,
    citation: "Siew et al. 2024 (cosmic kidney disease); post-flight stone incidence 2-7x pre-flight",
    action: {
      watch: "Drink an extra 500 ml today, cut salty foods, log urine colour tonight.",
      act: "Raise fluid intake to 3 L/day, cut sodium, flag to the crew medical officer and log urine colour every void.",
    },
    bodyParts: ["kidneys", "bones"],
  },
  {
    id: "fluid_shift",
    name: "Fluid shift syndrome (SANS)",
    signals: { plasma_volume_change_pct: 0.5 },
    needs: ["vision self-test score", "headache log", "puffy face check"],
    minActive: 2,
    citation: "NASA SANS brief (NTRS): ~66% of long-duration astronauts show early SANS signs",
    action: {
      watch: "Do the weekly vision self-test today and log any headache.",
      act: "Report blurred vision to the crew medical officer at once and schedule an eye exam.",
    },
    bodyParts: ["eyes", "head"],
  },
  {
    id: "cognitive_readiness",
    name: "Cognitive readiness",
    signals: { sleep_hours: 1.2, sleep_debt_h: 0.8, reaction_time_ms: 1.2, memory_score: 1, radiation_mSv_today: 0.4 },
    minActive: 2,
    citation: "Barger et al. 2014 (sleep ~6 h in flight); Nasrini et al. 2020 (one night without sleep slowed vigilance in HERA crews)",
    action: {
      watch: "Protect tonight's sleep window; re-test reaction time before any critical task.",
      act: "Delay high-risk tasks (EVA, docking) until a re-test passes; rest period now.",
    },
    bodyParts: ["mind"],
  },
  {
    id: "musculoskeletal",
    name: "Musculoskeletal decline",
    signals: { bone_density_pct: 1, calf_volume_pct: 1, exercise_min: 0.8, body_mass_kg: 0.6 },
    minActive: 2,
    citation: "NASA/National Academies: 1-1.5% bone loss per month; Trappe et al.: calf volume -13% after 6 months",
    action: {
      watch: "Add one resistance session this week; check load on the exercise device.",
      act: "Adjusted resistance plan from today; review with the flight surgeon at the next comm window.",
    },
    bodyParts: ["bones", "muscles"],
  },
  {
    id: "immune_strain",
    name: "Immune strain",
    signals: { sleep_debt_h: 1, stress_1to5: 1, mood_1to5: 0.6 },
    needs: ["skin symptoms", "cold sores"],
    minActive: 2,
    citation: "Rooney et al. 2019: 61% of ISS astronauts shed reactivated herpes viruses",
    action: {
      watch: "Prioritise rest and hygiene; log any cold sores or rashes.",
      act: "Rest priority today; log symptoms daily and report to the crew medical officer.",
    },
    bodyParts: ["whole_body"],
  },
  {
    id: "under_fuelling",
    name: "Under-fuelling",
    signals: { kcal_eaten: 1, body_mass_kg: 1, vitamin_d_ng_ml: 0.8 },
    minActive: 2,
    citation: "Smith et al. (NASA): ISS crews ate ~80% of needed energy; vitamin D falls without UV",
    action: {
      watch: "Add a snack to today's plan; take the vitamin D supplement.",
      act: "Meal plan review with the crew medical officer; daily body mass check.",
    },
    bodyParts: ["gut", "bones"],
  },
  {
    id: "solar_storm",
    name: "Solar storm exposure",
    signals: { radiation_mSv_today: 1 },
    minActive: 1,
    citation: "MSL RAD (SwRI): ~1.8 mSv/day in Mars cruise; solar particle events spike dose within hours",
    action: {
      watch: "Elevated radiation: stay near the shielded area and postpone non-essential EVA.",
      act: "Move to the storm shelter now; delay all EVAs until the dose rate falls.",
    },
    bodyParts: ["whole_body"],
    // Radiation uses an absolute check against the normal dose for this mission, not personal drift
    custom: ({ today, profile }) => {
      const ratio = today.radiation_mSv_today / NORMAL_DOSE[profile];
      const score = ratio <= 1.2 ? 0 : Math.min(6, (ratio - 1) * 1.5); // DEMO: ~2.7x normal = Watch, ~3.7x = Act
      return { score, contributors: score > 0 ? [{ signal: "radiation_mSv_today", score }] : [] };
    },
  },
];

const r1 = (x: number) => Math.round(x * 10) / 10;

export function evaluateRule(rule: CoupledRule, inp: RuleInput, baselineDays: number): RiskResult {
  let score: number;
  let contributors: Contributor[];

  if (rule.custom) {
    ({ score, contributors } = rule.custom(inp)!);
  } else {
    contributors = Object.keys(rule.signals)
      .filter((k) => inp.drift[k])
      .map((k) => ({ signal: k, score: inp.drift[k].score }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score);
    // Coupled score: weighted average of the drifting signals, boosted when several move together.
    const active = contributors.filter((c) => c.score >= ACTIVE);
    const wsum = active.reduce((a, c) => a + rule.signals[c.signal], 0);
    const avg = wsum === 0 ? 0 : active.reduce((a, c) => a + rule.signals[c.signal] * Math.min(c.score, 6), 0) / wsum;
    const coupling = active.length >= rule.minActive ? 1 + 0.15 * (active.length - 1) : 0.6; // lone signals count less
    score = avg * coupling;
  }

  const activeCount = contributors.filter((c) => c.score >= ACTIVE).length;
  // DEMO thresholds. Act needs several signals drifting together AND a high combined score,
  // because linked signals (e.g. sleep, reaction time, memory) move together after one bad night.
  let level: Level = "Nominal";
  if (score >= ACT_AT && activeCount >= rule.minActive) level = "Act";
  else if (score >= WATCH_AT) level = "Watch";

  // "Why is HALO unsure?"
  const uncertainty: string[] = ["Thresholds are demo parameters, not clinically validated."];
  let spread = 0.4;
  if (rule.needs?.length) {
    uncertainty.push(`Missing signals: ${rule.needs.join(", ")}.`);
    spread += 0.3 * rule.needs.length;
  }
  if (baselineDays < 7) {
    uncertainty.push(`Only ${baselineDays} days of personal baseline so far.`);
    spread += 0.5;
  }
  const stale = Object.keys(rule.signals).filter((k) => inp.drift[k]?.stale);
  if (stale.length) {
    uncertainty.push(`No fresh reading today for: ${stale.join(", ")}.`);
    spread += 0.3;
  }

  return {
    ruleId: rule.id,
    name: rule.name,
    level,
    score: r1(score),
    range: [r1(Math.max(0, score - spread)), r1(score + spread)],
    contributors: contributors.slice(0, 4).map((c) => ({ signal: c.signal, score: r1(c.score) })),
    action: level === "Act" ? rule.action.act : level === "Watch" ? rule.action.watch : "No action needed.",
    citation: rule.citation,
    uncertainty,
    bodyParts: rule.bodyParts,
  };
}
