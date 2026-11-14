// Checks baseline + drift scoring against the simulated crew data.
// Run: node --experimental-strip-types scripts/check_drift.ts   (Node 22.6+, or: npx tsx scripts/check_drift.ts)

import { readFileSync } from "node:fs";
import { computeBaselines, computeDrift } from "../src/engine/baseline.ts";
import type { Reading, SimData } from "../src/engine/types.ts";

const data: SimData = JSON.parse(readFileSync(new URL("../data/crew_sim.json", import.meta.url), "utf8"));
const lastDay = Math.max(...data.readings.map((r) => r.day));
const historyOf = (c: string): Reading[] => data.readings.filter((r) => r.crew_id === c);
const driftOf = (c: string, day: number) => {
  const h = historyOf(c);
  return computeDrift(h, computeBaselines(h), day);
};

let failures = 0;
const expect = (ok: boolean, msg: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failures++;
};
const f = (x: number) => x.toFixed(1);

// 1. Show one baseline band
const c2Bands = computeBaselines(historyOf("C2"));
const fl = c2Bands.fluid_intake_ml;
console.log(`Example band — C2 fluid intake: ${fl.lo.toFixed(0)}–${fl.hi.toFixed(0)} ml (normal spread ${fl.sd.toFixed(0)} ml, learned from ${fl.nDays} days)\n`);

// 2. Planted event checks
const stormC1 = driftOf("C1", 40).radiation_mSv_today;
for (const c of ["C1", "C2", "C3"]) {
  const d = driftOf(c, 40).radiation_mSv_today;
  expect(d.status === "far outside", `Day 40 solar storm: ${c} radiation ${f(d.value)} mSv, band ${f(d.bandLo)}–${f(d.bandHi)} -> ${d.status}`);
}
expect(driftOf("C1", 39).radiation_mSv_today.status === "inside band", `Day 39 (before storm): C1 radiation inside band`);
void stormC1;

const before = driftOf("C2", 50);
const after = driftOf("C2", 60);
expect(before.fluid_intake_ml.status === "inside band", `Day 50: C2 fluid intake inside band`);
expect(after.fluid_intake_ml.status === "far outside", `Day 60: C2 fluid intake ${f(after.fluid_intake_ml.value)} ml -> ${after.fluid_intake_ml.status} (how far ${f(after.fluid_intake_ml.howFar)} sd)`);
expect(after.bone_resorption_index.score >= 2, `Day 60: C2 bone breakdown marker drifting: how far ${f(after.bone_resorption_index.howFar)} sd, how fast ${f(after.bone_resorption_index.howFast)} sd/week -> ${after.bone_resorption_index.status}`);
const c1Bone = driftOf("C1", 60).bone_resorption_index;
expect(c1Bone.status === "inside band", `Day 60: C1 bone marker inside band (normal in-flight rise is not flagged, score ${f(c1Bone.score)})`);

const c3 = driftOf("C3", 70);
expect(c3.sleep_hours.status === "far outside", `Day 70: C3 sleep ${f(c3.sleep_hours.value)} h -> ${c3.sleep_hours.status}`);
expect(c3.reaction_time_ms.status === "far outside", `Day 70: C3 reaction time ${c3.reaction_time_ms.value.toFixed(0)} ms (band ${c3.reaction_time_ms.bandLo.toFixed(0)}–${c3.reaction_time_ms.bandHi.toFixed(0)}) -> ${c3.reaction_time_ms.status}`);

// 3. Speed: does "how fast" warn before "how far" crosses the edge?
let firstFastWarn = 0;
let firstOutside = 0;
for (let d = 55; d <= lastDay; d++) {
  const b = driftOf("C2", d).bone_resorption_index;
  if (!firstFastWarn && b.howFast >= 2) firstFastWarn = d;
  if (!firstOutside && b.howFar >= 2) firstOutside = d;
}
expect(firstFastWarn > 0 && firstFastWarn <= firstOutside, `C2 bone marker: speed warning on day ${firstFastWarn}, crosses band edge on day ${firstOutside}`);

// 4. Noise check: how often does a signal go "far outside" with no planted event behind it?
const planted = (c: string, key: string, d: number, r: Reading) =>
  (key === "radiation_mSv_today" && (d === 40 || d === 41)) ||
  (c === "C2" && d >= 55 && ["fluid_intake_ml", "urine_color_1to8", "sodium_mg", "bone_resorption_index", "bone_density_pct", "calf_volume_pct", "exercise_min"].includes(key)) ||
  (c === "C3" && d === 70) ||
  (["sleep_hours", "reaction_time_ms", "memory_score", "sleep_debt_h", "stress_1to5", "mood_1to5"].includes(key) && (r.sleep_hours <= 5.0 || r.radiation_mSv_today > 5));
let checks = 0;
let unexplained = 0;
for (const c of data.crew.map((m) => m.id)) {
  const h = historyOf(c);
  const bands = computeBaselines(h);
  for (let d = 21; d <= lastDay; d++) {
    const r = h.find((x) => x.day === d)!;
    for (const [key, dr] of Object.entries(computeDrift(h, bands, d))) {
      checks++;
      if (dr.status === "far outside" && !planted(c, key, d, r)) unexplained++;
    }
  }
}
const rate = (100 * unexplained) / checks;
console.log(`\nNoise: ${unexplained} unexplained "far outside" readings out of ${checks} signal-days (${rate.toFixed(2)}%)`);
expect(rate < 1, `Unexplained "far outside" rate under 1%`);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
