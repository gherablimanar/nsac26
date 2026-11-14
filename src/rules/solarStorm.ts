import type { CouplingRule } from "./types.ts";
import type { MissionProfile } from "../engine/types.ts";

// Normal daily dose by mission profile (mSv/day): ISS ~100 mSv per 6 months; Mars cruise 1.8 (MSL RAD);
// Moon is a DEMO estimate (no real feed yet).
export const NORMAL_DOSE: Record<MissionProfile, number> = { iss: 0.55, moon: 1.4, mars_transit: 1.8 };

// Solar particle events spike the dose within hours. Radiation is judged against the normal dose
// for the mission, not against personal drift, and one signal is enough here.
export const solarStorm: CouplingRule = {
  id: "solar_storm",
  name: "Solar storm exposure",
  signals: { radiation_mSv_today: 1 },
  minLinked: 1,
  why: "Solar particle events spike the dose fast",
  source: "SwRI MSL RAD; NASA OSDR RadLab",
  action: {
    watch: "Radiation is up: stay near the shielded area and postpone non-essential spacewalks.",
    act: "Move to the shielded shelter now; delay the spacewalk.",
  },
  bodyParts: ["mind", "gut", "bones"],
  score: ({ today, profile }) => {
    const ratio = today.radiation_mSv_today / NORMAL_DOSE[profile];
    // DEMO: under 1.2x normal = calm; ~2.7x = Watch; ~3.7x = Act
    const score = ratio <= 1.2 ? 0 : Math.min(6, (ratio - 1) * 1.5);
    return { score, contributors: score > 0 ? [{ signal: "radiation_mSv_today", label: "Radiation today", score }] : [] };
  },
};
