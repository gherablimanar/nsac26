// HALO Coupled Risk Engine — the one file the UI needs to import.
//
//   import { runEngine } from "./engine/engine.ts";
//   const report = runEngine(simData, "C2", 60, "mars_transit");
//
// Pipeline (the "data -> interpretation -> decision" line from the pitch):
//   readings -> personal baseline bands -> drift scores -> coupled rules -> named risks + action cards
//   -> body map colours + mission readiness gate + escalation path.

import { computeBaselines, computeDrift, signalLevel, type Band, type Drift } from "./baseline.ts";
import { RULES, evaluateRule, type RiskResult } from "./rules.ts";
import { SIGNAL_BY_KEY } from "./signals.ts";
import type { Level, MissionProfile, Reading, SimData } from "./types.ts";

export type Gate = { decision: "GO" | "CAUTION" | "NO-GO"; reason: string } | null;

export type EngineReport = {
  crewId: string;
  day: number;
  profile: MissionProfile;
  risks: RiskResult[]; // all rules, worst first
  bodyMap: Record<string, Level>; // body part -> worst level touching it
  signals: Record<string, { value: number; band: Band; drift: Drift; level: Level }>;
  readinessGate: Gate; // set when a spacewalk / high-risk task is scheduled today
  escalation: { signalDelayMin: number; path: string };
};

const RANK: Record<Level, number> = { Nominal: 0, Watch: 1, Act: 2 };
const worse = (a: Level, b: Level): Level => (RANK[a] >= RANK[b] ? a : b);

// One-way signal delay to Earth (minutes). Mars varies 4-24 min; we use the worst-case ~20 from the plan.
export const SIGNAL_DELAY_MIN: Record<MissionProfile, number> = { iss: 0, moon: 0.02, mars_transit: 20 };

export function runEngine(data: SimData, crewId: string, day: number, profile: MissionProfile = "mars_transit"): EngineReport {
  const history: Reading[] = data.readings.filter((r) => r.crew_id === crewId && r.day <= day);
  if (history.length === 0) throw new Error(`No readings for ${crewId} up to day ${day}`);
  const today = history[history.length - 1];

  const bands = computeBaselines(history);
  const baselineDays = Object.values(bands)[0]?.nDays ?? 0;
  const drift = computeDrift(history, bands, day);

  const risks = RULES.map((rule) => evaluateRule(rule, { day, today, drift, profile }, baselineDays)).sort(
    (a, b) => RANK[b.level] - RANK[a.level] || b.score - a.score,
  );

  // Body map: each part takes the worst level of any risk or single signal that touches it
  const bodyMap: Record<string, Level> = {};
  for (const r of risks) for (const p of r.bodyParts) bodyMap[p] = worse(bodyMap[p] ?? "Nominal", r.level);

  const signals: EngineReport["signals"] = {};
  for (const [k, band] of Object.entries(bands)) {
    const d = drift[k];
    if (!d) continue;
    // A single signal on its own can reach Watch; Act needs a coupled rule (avoids alarm fatigue)
    const lvl: Level = signalLevel(d.score) === "Nominal" ? "Nominal" : "Watch";
    signals[k] = { value: d.value, band, drift: d, level: lvl };
    const part = SIGNAL_BY_KEY[k].bodyPart;
    bodyMap[part] = worse(bodyMap[part] ?? "Nominal", lvl);
  }

  // Mission readiness gate before high-risk tasks
  let readinessGate: Gate = null;
  if (today.eva_scheduled) {
    const cog = risks.find((r) => r.ruleId === "cognitive_readiness")!;
    const storm = risks.find((r) => r.ruleId === "solar_storm")!;
    const worst = worse(cog.level, storm.level);
    const why = [cog, storm]
      .filter((r) => r.level !== "Nominal")
      .map((r) => `${r.name}: ${r.level}`)
      .join("; ");
    readinessGate =
      worst === "Act"
        ? { decision: "NO-GO", reason: why }
        : worst === "Watch"
          ? { decision: "CAUTION", reason: why }
          : { decision: "GO", reason: "Sleep, cognition and radiation all within personal baseline." };
  }

  const delay = SIGNAL_DELAY_MIN[profile];
  const path =
    profile === "iss"
      ? "Act = call the flight surgeon now."
      : profile === "moon"
        ? "Act = call the flight surgeon now (~1.3 s delay)."
        : `Act = follow the onboard protocol now and send a report; it reaches Earth in ~${delay} min, reply in ~${delay * 2} min.`;

  return { crewId, day, profile, risks, bodyMap, signals, readinessGate, escalation: { signalDelayMin: delay, path } };
}
