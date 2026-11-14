import type { DriftStatus } from "../engine/baseline.ts";
import type { MissionProfile } from "../engine/types.ts";

export type Gate = "Go" | "Caution" | "No-go";

// DEMO rule: each input maps from the engine's drift status; the overall gate is the worst input.
// Thresholds come from the engine's demo parameters, not from flight rules.
export const GATE_OF: Record<DriftStatus, Gate> = {
  "inside band": "Go",
  "outside band": "Caution",
  "far outside": "No-go",
};
const RANK: Record<Gate, number> = { "Go": 0, "Caution": 1, "No-go": 2 };
export const worstGate = (gates: Gate[]): Gate => gates.reduce((w, g) => (RANK[g] > RANK[w] ? g : w), "Go" as Gate);

export type ProfileInfo = { id: MissionProfile; label: string; delay: string; roundTrip: string; dose: string; escalation: string };

// MOCK: reference text per mission profile (Mars numbers from MSL RAD; the Moon has no real feed yet).
export const PROFILES: ProfileInfo[] = [
  { id: "iss", label: "ISS", delay: "Live link", roundTrip: "",
    dose: "About 0.55 mSv per day (100 mSv per 6 months)",
    escalation: "Act means call the flight surgeon now." },
  { id: "moon", label: "Moon surface", delay: "1.3 s", roundTrip: "about 2.6 s",
    dose: "No real feed yet, demo estimate only",
    escalation: "Act means call the flight surgeon now; the delay is under 2 seconds." },
  { id: "mars_transit", label: "Mars transit", delay: "18 min", roundTrip: "about 36 min",
    dose: "1.8 mSv per day in cruise, about 660 mSv for a round trip (MSL RAD)",
    escalation: "Act means follow the onboard protocol now; your report reaches Houston in 18 min." },
];

// MOCK: one queued note to the flight surgeon.
export const OUTBOX = {
  title: "Kidney stone note for your flight surgeon",
  queued: "10:28",
  arrives: "10:46",
  note: "Day 58. Fluid intake down by half since Day 55, urine colour 6 of 8, sodium above normal. Crew member asked about ibuprofen; HALO did not advise. Please confirm the plan.",
};
