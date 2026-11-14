// Builds what the Overview shows for one astronaut on one mission day.
// Bands and drift come from the engine (src/engine/baseline.ts). The priority risk text and the
// task list are MOCK until the coupling rules in src/rules exist.
import { bandCentreAt, computeBaselines, computeDrift, type Drift } from "../engine/baseline.ts";
import { SIGNAL_BY_KEY } from "../engine/signals.ts";
import { historyOf, readingOn } from "../data/crew.ts";
import type { BodySystem, LinkedSeries, OverviewModel, PriorityRisk, ReadingSummary, SystemStatus, Task } from "./viewTypes.ts";

// MOCK: what the kidney-stone coupling rule (brief p. 7, Siew et al. 2024) would return for Marco.
const RISKS: Record<string, PriorityRisk> = {
  C2: {
    title: "Kidney stone risk is rising",
    level: "watch",
    sinceDay: 55,
    why: "Your fluid intake fell by half on Day 55. Since then your urine has darkened, you are eating more salt, and your bone breakdown marker keeps climbing. Together, that is how kidney stones form in microgravity.",
    action: "Drink 500 ml more today",
    signals: ["fluid_intake_ml", "urine_color_1to8", "sodium_mg", "bone_resorption_index"],
    eventDay: 55,
    eventLabel: "intake dropped",
    otherRisks: ["cognitive readiness", "bone and muscle loss", "fluid shift", "solar storm"],
  },
};

// MOCK: the day's routine until a schedule source exists.
const TASKS: Task[] = [
  { id: "urine", label: "Log urine colour", when: "Before sleep", done: false },
  { id: "workout", label: "Resistance workout", done: true },
  { id: "reaction", label: "Reaction test", when: "3 minutes, before 18:00", done: false },
];

const SHORT_LABEL: Record<string, string> = { bone_resorption_index: "Bone breakdown", sodium_mg: "Sodium intake" };

function display(key: string, v: number): { now: string; unit: string } {
  switch (key) {
    case "fluid_intake_ml": return { now: (v / 1000).toFixed(2), unit: "L" };
    case "urine_color_1to8": return { now: String(Math.round(v)), unit: "of 8" };
    case "sodium_mg": return { now: Math.round(v).toLocaleString("en-US"), unit: "mg" };
    default: return { now: String(Math.round(v)), unit: SIGNAL_BY_KEY[key]?.unit ?? "" };
  }
}

// Which signals belong to which body system (presentation grouping, see note in viewTypes.ts).
const SYSTEM_SIGNALS: Record<BodySystem["id"], string[]> = {
  mind: ["sleep_hours", "sleep_debt_h", "mood_1to5", "stress_1to5", "reaction_time_ms", "memory_score"],
  eyes: [], // no eye readings in the simulator yet: shows as unknown
  heart: ["heart_rate", "bp_sys", "bp_dia", "spo2"],
  kidneys: ["fluid_intake_ml", "urine_color_1to8", "sodium_mg"],
  musculo: ["bone_density_pct", "bone_resorption_index", "calf_volume_pct", "body_mass_kg"],
};
const SYSTEM_LABEL: Record<BodySystem["id"], string> = {
  mind: "Sleep and mind", eyes: "Eyes", heart: "Heart and blood", kidneys: "Kidneys", musculo: "Bones and muscle",
};

const statusOf = (d?: Drift): SystemStatus => (!d ? "unknown" : d.status === "inside band" ? "normal" : "watch");

export function buildOverview(crewId: string, day: number): OverviewModel {
  const history = historyOf(crewId);
  const bands = computeBaselines(history);
  const drift = computeDrift(history, bands, day);
  const risk = RISKS[crewId] ?? null;

  const from = day - 14;
  const series: LinkedSeries[] = (risk?.signals ?? []).map((key) => {
    const b = bands[key];
    const bad = SIGNAL_BY_KEY[key]?.badDirection ?? 0;
    const rows = history.filter((r) => r.day >= from && r.day <= day);
    const pts = rows.map((r) => {
      const value = r[key as keyof typeof r] as number;
      const c = bandCentreAt(b, r.day);
      const band: [number, number] = [c - 2 * b.sd, c + 2 * b.sd];
      const isOut = bad < 0 ? value < band[0] : bad > 0 ? value > band[1] : value < band[0] || value > band[1];
      return { day: r.day, value, band, isOut };
    });
    // A segment is drawn amber when it ends outside the band, so include its start point too.
    const points = pts.map((p, i) => ({
      day: p.day, value: p.value, band: p.band,
      out: p.isOut || pts[i + 1]?.isOut ? p.value : null,
    }));
    const last = pts[pts.length - 1];
    return { key, label: SHORT_LABEL[key] ?? SIGNAL_BY_KEY[key]?.label ?? key, ...display(key, last.value), outNow: last.isOut, points };
  });

  const systems: BodySystem[] = (Object.keys(SYSTEM_SIGNALS) as BodySystem["id"][]).map((id) => {
    const keys = SYSTEM_SIGNALS[id];
    if (keys.length === 0) return { id, label: SYSTEM_LABEL[id], status: "unknown", detail: "No reading yet" };
    const statuses = keys.map((k) => statusOf(drift[k]));
    const status: SystemStatus = statuses.includes("watch") ? "watch" : statuses.every((s) => s === "unknown") ? "unknown" : "normal";
    return { id, label: SYSTEM_LABEL[id], status, detail: status === "watch" ? "Watch" : status === "unknown" ? "No reading yet" : "Normal" };
  });

  // Whatever needs attention comes first; missing data last
  const rank = { act: 0, watch: 1, normal: 2, unknown: 3 } as const;
  systems.sort((a, b) => rank[a.status] - rank[b.status]);

  const today = readingOn(crewId, day);
  const range = (k: string, digits = 0) => `${drift[k].bandLo.toFixed(digits)}-${drift[k].bandHi.toFixed(digits)}`;
  const out = (k: string) => drift[k]?.status !== "inside band";
  const readings: ReadingSummary[] = today ? [
    { label: "Heart rate", value: String(today.heart_rate), unit: "bpm", note: `Your normal ${range("heart_rate")}`, out: out("heart_rate") },
    { label: "Blood pressure", value: `${today.bp_sys}/${today.bp_dia}`, note: `Your normal ${range("bp_sys")} / ${range("bp_dia")}`, out: out("bp_sys") || out("bp_dia") },
    { label: "Sleep last night", value: today.sleep_hours.toFixed(1), unit: "h", note: `Your normal ${range("sleep_hours", 1)}`, out: out("sleep_hours") },
    { label: "Radiation today", value: today.radiation_mSv_today.toFixed(2), unit: "mSv", note: `${Math.round(today.radiation_mSv_total)} mSv this mission`, out: out("radiation_mSv_today") },
  ] : [];

  return { risk, series, tasks: TASKS, systems, readings };
}
