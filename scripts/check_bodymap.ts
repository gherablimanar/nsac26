import {computeBaselines} from "../src/engine/baseline.ts";
// Checks the body-map model (src/bodymap) against the engine and the planted events.
// Run: npm run check:bodymap   (= node --experimental-strip-types scripts/check_bodymap.ts, Node 22.6+)

import { readFileSync } from "node:fs";
import { buildBodyMapModel, regionsForRisk, type BodyMapModel } from "../src/bodymap/model.ts";
import { REGIONS } from "../src/bodymap/regions.ts";
import { SIGNAL_BY_KEY } from "../src/engine/signals.ts";
import { COUPLING_RULES } from "../src/rules/index.ts";
import type { Reading, SimData } from "../src/engine/types.ts";

const data: SimData = JSON.parse(readFileSync(new URL("../data/crew_sim.json", import.meta.url), "utf8"));
const historyOf = (c: string): Reading[] => data.readings.filter((r) => r.crew_id === c).map((r) => ({ ...r }));
const model = (c: string, d: number, h = historyOf(c)) => buildBodyMapModel(h, d, "mars_transit");

let failures = 0;
const expect = (ok: boolean, msg: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failures++;
};
const st = (m: BodyMapModel, id: keyof BodyMapModel["regions"]) => m.regions[id].status;

// Config integrity: every id the map uses exists in the engine
const ruleIds = new Set(COUPLING_RULES.map((r) => r.id));
const sample = data.readings[0] as Record<string, unknown>;
for (const r of REGIONS) {
  for (const k of [...r.signalIds, ...r.driverIds]) expect(k in SIGNAL_BY_KEY, `${r.id}: signal ${k} has a SignalDef`);
  for (const k of r.rawSignalIds) expect(k in sample && !(k in SIGNAL_BY_KEY), `${r.id}: raw field ${k} exists in the data and has no SignalDef`);
  for (const k of r.riskIds) expect(ruleIds.has(k), `${r.id}: risk ${k} exists in COUPLING_RULES`);
}

// Planted event 2: C2 fluid drop from day 55
const c2d50 = model("C2", 50);
expect(st(c2d50, "kidneys") !== "act", `C2 day 50: kidneys not act (got ${st(c2d50, "kidneys")})`);
const c2d58 = model("C2", 58);
const kid = c2d58.regions.kidneys;
const ks = kid.risks.find((r) => r.ruleId === "kidney_stone");
expect(kid.status === "act", `C2 day 58: kidneys act (got ${kid.status})`);
expect(!!ks && ks.level === "Act" && ks.why.length > 0 && ks.action.length > 0, "C2 day 58: kidney stone risk carries mechanism (why) and action");
expect(st(c2d58, "skeleton") === "act", `C2 day 58: skeleton shares the kidney stone Act (got ${st(c2d58, "skeleton")})`);
expect(c2d58.overall === "act", "C2 day 58: overall status act");

// Musculoskeletal Watch (C2 skips workouts later in the mission)
const mskDay = Array.from({ length: 100 }, (_, i) => 21 + i).find(
  (d) => model("C2", d).risks.find((r) => r.ruleId === "musculoskeletal")?.level === "Watch",
);
expect(mskDay !== undefined, `C2: musculoskeletal reaches Watch (first on day ${mskDay})`);
if (mskDay !== undefined) expect(st(model("C2", mskDay), "muscles") === "watch", `C2 day ${mskDay}: muscles watch`);

// Planted event 1: solar storm day 40
const c1d40 = model("C1", 40);
expect(["watch", "act"].includes(st(c1d40, "whole_body")), `C1 day 40: whole_body watch/act from the solar storm (got ${st(c1d40, "whole_body")})`);
expect(c1d40.regions.whole_body.risks.some((r) => r.ruleId === "solar_storm" && r.level !== "Nominal"), "C1 day 40: solar storm risk linked to whole_body");

// Missing data: spo2 deleted everywhere -> lungs unknown (not nominal)
const noSpo2 = historyOf("C1").map((r) => {
  const x = { ...r } as Partial<Reading>;
  delete x.spo2;
  return x as Reading;
});
expect(st(model("C1", 30, noSpo2), "lungs") === "unknown", `Synthetic, no spo2: lungs unknown (got ${st(model("C1", 30, noSpo2), "lungs")})`);

// Stale data: last 5 days of fluid fields removed -> kidneys stale
const FLUID = ["fluid_intake_ml", "urine_color_1to8", "sodium_mg"] as const;
const staleH = historyOf("C1").map((r) => {
  if (r.day <= 25) return r;
  const x = { ...r } as Partial<Reading>;
  for (const k of FLUID) delete x[k];
  return x as Reading;
});
const staleM = model("C1", 30, staleH);
expect(staleM.regions.kidneys.status === "stale", `Synthetic, fluid fields missing days 26-30: kidneys stale (got ${staleM.regions.kidneys.status})`);
expect(staleM.regions.kidneys.staleInputs.length === 3, "Synthetic stale: all 3 kidney inputs listed as stale");

// Guard: field without SignalDef shows raw value, "no baseline"
const load = model("C1", 30).regions.muscles.indicators.find((i) => i.key === "resistance_load_kg");
expect(!!load && load.status === "no_baseline" && load.value !== null, "resistance_load_kg: raw value, status no baseline");

// Regions with no direct signal are never nominal
expect(st(model("C1", 30), "eyes") === "unknown", "C1 day 30: eyes unknown (no direct reading), not nominal");

// Coupled risk -> regions
const kr = regionsForRisk("kidney_stone");
expect(kr.includes("kidneys") && kr.includes("skeleton"), `regionsForRisk(kidney_stone) = ${kr.join(", ")}`);

// Nominal case
const c1d30 = model("C1", 30);
expect(c1d30.risks.every((r) => r.level === "Nominal" || r.level === "Unknown"), "C1 day 30: no active coupled pattern; missing hypotheses remain Unknown");
expect(st(c1d30, "kidneys") === "nominal" && st(c1d30, "heart") === "nominal", "C1 day 30: kidneys and heart nominal");
expect(c1d30.overall === "watch", `C1 day30 calibrated data: direct memory drift produces Watch (got ${c1d30.overall})`);
expect(c1d30.regions.brain.indicators.some(i=>i.key==='memory_score'&&i.status==='outside'), 'C1 day30 memory is outside its reference: 77 vs lower band77.2857');
// Controlled quiet data is the nominal fixture. The regenerated day30 data is not quiet.
const base=computeBaselines(historyOf('C1'));
const quiet=historyOf('C1').map(r=>{const row={...r};for(const [key,b] of Object.entries(base))(row as any)[key]=b.mean+b.expectedPerDay*(r.day-b.centerDay);return row;});
expect(model('C1',30,quiet).overall==='nominal','Controlled reference-following history: overall Nominal');

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
