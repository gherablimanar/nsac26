// Builds what the Overview shows for one astronaut on one mission day.
// Shared as-of-day assessment supplies risk levels, explanations and review tasks.
import {
  bandCentreAt,
  computeBaselines,
  computeDrift,
} from "../engine/baseline.ts";
import { SIGNAL_BY_KEY } from "../engine/signals.ts";
import { MISSION_PROFILE, historyOf, readingOn } from "../data/crew.ts";
import { assessCrew } from "../engine/assessment.ts";
import { contextOf } from "../data/crew.ts";
import type {
  BodySystem,
  LinkedSeries,
  OverviewModel,
  PriorityRisk,
  ReadingSummary,
  Task,
} from "./viewTypes.ts";
import { SYSTEMS, systemStatus } from "./systems.ts";

const SHORT_LABEL: Record<string, string> = {
  bone_resorption_index: "Bone breakdown",
  sodium_mg: "Sodium intake",
};

function display(key: string, v: number): { now: string; unit: string } {
  switch (key) {
    case "fluid_intake_ml":
      return { now: (v / 1000).toFixed(2), unit: "L" };
    case "urine_color_1to8":
      return { now: String(Math.round(v)), unit: "of 8" };
    case "sodium_mg":
      return { now: Math.round(v).toLocaleString("en-US"), unit: "mg" };
    default:
      return {
        now: String(Math.round(v)),
        unit: SIGNAL_BY_KEY[key]?.unit ?? "",
      };
  }
}

export function buildOverview(crewId: string, day: number): OverviewModel {
  const history = historyOf(crewId);
  const bands = computeBaselines(
    history.filter((r) => r.day <= day),
    day,
  );
  const drift = computeDrift(history, bands, day);
  const assessment = assessCrew(
    history,
    day,
    MISSION_PROFILE,
    contextOf(crewId, day),
  );
  const r = assessment.priority;
  const risk: PriorityRisk | null = r
    ? {
        ruleId: r.ruleId,
        title: r.name + " pattern",
        actTitle: r.name + " pattern: Act",
        level: r.level === "Act" ? "act" : "watch",
        sinceDay: Math.max(1, day - r.persistence.observed + 1),
        short: r.why + ". Demonstration parameters; human review required.",
        why: [r.why, ...r.uncertainty].join(" "),
        action: r.action,
        signals: r.contributors.map((c) => c.signal).filter((k) => bands[k]),
        eventDay: day - r.persistence.observed + 1,
        eventLabel: "persistent pattern",
        otherRisks: assessment.unknown,
        systemIds: r.bodyParts as PriorityRisk["systemIds"],
        plan: [
          {
            id: r.ruleId + "-review",
            label: "Review contributing readings and missing inputs",
            when: "Before making a decision",
            cta: "Record review",
          },
          {
            id: r.ruleId + "-protocol",
            label: r.action,
            when: "Use approved onboard procedures",
            cta: "Record protocol review",
          },
        ],
      }
    : null;
  const tasks: Task[] = assessment.risks
    .filter((r) => r.level === "Act" || r.level === "Watch")
    .map((r) => ({ id: r.ruleId, label: r.action, done: false }));

  const from = day - 14;
  const series: LinkedSeries[] = (risk?.signals ?? []).map((key) => {
    const b = bands[key];
    const bad = SIGNAL_BY_KEY[key]?.badDirection ?? 0;
    const rows = history.filter((r) => r.day >= from && r.day <= day);
    const pts = rows.map((r) => {
      const value = r[key as keyof typeof r] as number;
      const c = bandCentreAt(b, r.day);
      const band: [number, number] = [c - 2 * b.sd, c + 2 * b.sd];
      const isOut =
        bad < 0
          ? value < band[0]
          : bad > 0
            ? value > band[1]
            : value < band[0] || value > band[1];
      return { day: r.day, value, band, isOut };
    });
    // A segment is drawn amber when it ends outside the band, so include its start point too.
    const points = pts.map((p, i) => ({
      day: p.day,
      value: p.value,
      band: p.band,
      out: p.isOut || pts[i + 1]?.isOut ? p.value : null,
    }));
    const last = pts[pts.length - 1];
    return {
      key,
      label: SHORT_LABEL[key] ?? SIGNAL_BY_KEY[key]?.label ?? key,
      ...display(key, last.value),
      outNow: last.isOut,
      points,
    };
  });

  const statusText = {
    normal: "Normal",
    watch: "Watch",
    act: "Act",
    unknown: "No reading yet",
  } as const;
  const systems: BodySystem[] = SYSTEMS.map((def) => {
    const status = systemStatus(def, drift);
    return { id: def.id, label: def.label, status, detail: statusText[status] };
  });

  const today = readingOn(crewId, day);
  const range = (k: string, digits = 0) =>
    drift[k]
      ? `${drift[k].bandLo.toFixed(digits)}-${drift[k].bandHi.toFixed(digits)}`
      : "insufficient reference";
  const out = (k: string) => drift[k]?.status !== "inside band";
  const readings: ReadingSummary[] = today
    ? [
        {
          label: "Heart rate",
          value: String(today.heart_rate),
          unit: "bpm",
          note: `Your normal ${range("heart_rate")}`,
          out: out("heart_rate"),
        },
        {
          label: "Blood pressure",
          value: `${today.bp_sys}/${today.bp_dia}`,
          note: `Your normal ${range("bp_sys")} / ${range("bp_dia")}`,
          out: out("bp_sys") || out("bp_dia"),
        },
        {
          label: "Sleep last night",
          value: today.sleep_hours.toFixed(1),
          unit: "h",
          note: `Your normal ${range("sleep_hours", 1)}`,
          out: out("sleep_hours"),
        },
        {
          label: "Radiation today",
          value: today.radiation_mSv_today.toFixed(2),
          unit: "mSv",
          note: `${Math.round(today.radiation_mSv_total)} mSv this mission`,
          out: out("radiation_mSv_today"),
        },
      ]
    : [];

  return { risk, series, tasks, systems, readings };
}

/** Completing a plan records an action, never changes physiological severity. */
export const easedToday = (_risk: PriorityRisk | null, _done: string[]) =>
  false;
