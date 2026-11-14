// Runs the engine over every crew member and every day, and checks the planted demo events.
// Run: node --experimental-strip-types scripts/check_engine.ts
// (Node 22.6+; or `npx tsx scripts/check_engine.ts`)

import { readFileSync } from "node:fs";
import { runEngine } from "../src/engine/engine.ts";
import { forecastPotency } from "../src/engine/potency.ts";
import type { SimData } from "../src/engine/types.ts";

const data: SimData = JSON.parse(readFileSync(new URL("../data/crew_sim.json", import.meta.url), "utf8"));
const days = Math.max(...data.readings.map((r) => r.day));
const short: Record<string, string> = { Nominal: ".", Watch: "w", Act: "A" };

let failures = 0;
const expect = (ok: boolean, msg: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failures++;
};

// Timeline: one character per day per risk (. Nominal, w Watch, A Act), days 15-120
for (const c of data.crew) {
  console.log(`\n${c.id} ${c.name}`);
  const rows: Record<string, string> = {};
  for (let d = 21; d <= days; d++) {
    for (const r of runEngine(data, c.id, d).risks) rows[r.name] = (rows[r.name] ?? "") + short[r.level];
  }
  for (const [name, line] of Object.entries(rows)) console.log(`  ${name.padEnd(28)} ${line}`);
}
console.log("  (columns = day 21 ... day 120)\n");

const lvl = (c: string, d: number, id: string) => runEngine(data, c, d).risks.find((r) => r.ruleId === id)!.level;

// Planted event 1: solar storm day 40, everyone
for (const c of ["C1", "C2", "C3"]) expect(lvl(c, 40, "solar_storm") === "Act", `${c} solar storm = Act on day 40`);
expect(lvl("C1", 39, "solar_storm") === "Nominal" && lvl("C1", 43, "solar_storm") === "Nominal", "solar storm is quiet before and after");

// Planted event 2: C2 kidney stone risk rises after day 55, others stay calm
expect(lvl("C2", 50, "kidney_stone") === "Nominal", "C2 kidney Nominal before the drop (day 50)");
const firstAct = Array.from({ length: days - 54 }, (_, i) => 55 + i).find((d) => lvl("C2", d, "kidney_stone") === "Act");
expect(firstAct !== undefined && firstAct <= 62, `C2 kidney reaches Act within a week of day 55 (day ${firstAct})`);
for (const c of ["C1", "C3"]) {
  const any = Array.from({ length: days - 20 }, (_, i) => 21 + i).some((d) => lvl(c, d, "kidney_stone") === "Act");
  expect(!any, `${c} never gets a kidney Act`);
}

// Planted event 3: C3 short sleep before EVA on day 70 -> NO-GO
const r70 = runEngine(data, "C3", 70);
expect(r70.readinessGate?.decision === "NO-GO", `C3 readiness gate day 70 = ${r70.readinessGate?.decision} (${r70.readinessGate?.reason})`);
for (const c of ["C1", "C2"]) {
  const g = runEngine(data, c, 70).readinessGate?.decision;
  expect(g !== "NO-GO", `${c} readiness gate day 70 = ${g}`);
}

// False alarm check: how many crew-days have any Act outside the planted events?
const todayOf = (c: string, d: number) => data.readings.find((r) => r.crew_id === c && r.day === d)!;
let extra = 0;
for (const c of data.crew) {
  for (let d = 21; d <= days; d++) {
    for (const r of runEngine(data, c.id, d).risks) {
      if (r.level !== "Act") continue;
      const planted =
        (r.ruleId === "solar_storm" && (d === 40 || d === 41)) ||
        (c.id === "C2" && r.ruleId === "kidney_stone" && d >= 55) ||
        (c.id === "C3" && r.ruleId === "cognitive_readiness" && d === 70) ||
        (c.id === "C2" && r.ruleId === "musculoskeletal" && d >= 55) || // C2 also skips workouts from day 55
        // the random data also contains some genuinely bad nights; flagging those is correct, not a false alarm
        (r.ruleId === "cognitive_readiness" && (todayOf(c.id, d).sleep_hours <= 5.0 || todayOf(c.id, d).radiation_mSv_today > 5));
      if (!planted) {
        extra++;
        console.log(`  extra Act: ${c.id} day ${d} ${r.name} score ${r.score}`);
      }
    }
  }
}
expect(extra === 0, `unplanned Act alerts across 3 crew x 100 days: ${extra}`);

// Example report for the demo moment
const demo = runEngine(data, "C2", 60);
const k = demo.risks[0];
console.log(`\nDemo: C2 day 60 top risk -> ${k.name} [${k.level}] score ${k.score} (range ${k.range.join("-")})`);
console.log(`  because: ${k.contributors.map((c) => `${c.signal} ${c.score}`).join(", ")}`);
console.log(`  action: ${k.action}`);
console.log(`  body map: ${JSON.stringify(demo.bodyMap)}`);
console.log(`  escalation: ${demo.escalation.path}`);

// Potency tracker
const total = data.readings.filter((r) => r.crew_id === "C1").reduce((a, r) => a + r.radiation_mSv_today, 0);
console.log(`\nPotency at day ${days} (cumulative dose ${total.toFixed(0)} mSv):`);
for (const m of forecastPotency(days, total)) {
  console.log(`  ${m.name.padEnd(26)} ${m.potencyPct.toFixed(1)}%  ${m.status.padEnd(8)} below spec on mission day ${m.belowSpecOnDay ?? "-"}`);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
