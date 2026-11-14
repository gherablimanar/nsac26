// Personal baseline bands + drift scores.
//
// Baseline: each astronaut's own normal range for each signal, taken from their first
// days in flight (days 7-20, after the fluid shift and the first-week sleep adjustment settle). A real system would start
// from pre-flight data; we use early-flight days so the shifts that EVERY astronaut gets
// on arrival (e.g. plasma drop) aren't flagged as a personal problem.
//
// Drift: how far today's value (3-day average) sits from the baseline, in standard
// deviations, signed so that positive = moving in the BAD direction for that signal.
// Plus a 7-day trend, so slow steady drift is caught before it crosses a fixed limit
// (this is the "anomaly detection" from the plan).

import type { Reading } from "./types.ts";
import { SIGNALS, SIGNAL_BY_KEY } from "./signals.ts";

export const BASELINE_WINDOW = { from: 7, to: 20 };

export type Band = {
  mean: number; // at centerDay
  sd: number;
  lo: number; // mean - 2 sd (at centerDay)
  hi: number; // mean + 2 sd (at centerDay)
  nDays: number;
  centerDay: number;
  expectedPerDay: number; // the band slides along the published in-flight rate (0 for most signals)
};

/** Where this person's band is centred on a given day (moves for bone, muscle, mass, vitamin D). */
export const expectedAt = (b: Band, day: number) => b.mean + b.expectedPerDay * (day - b.centerDay);

export type Drift = {
  signal: string;
  value: number;
  z: number; // signed toward the bad direction
  trendPerWeek: number; // in sd per week, signed toward bad
  score: number; // max(z, combined z + trend), what rules use
  stale: boolean;
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
};

function slope(ys: number[]): number {
  // least-squares slope per step
  const n = ys.length;
  if (n < 3) return 0;
  const xm = (n - 1) / 2;
  const ym = mean(ys);
  let num = 0;
  let den = 0;
  ys.forEach((y, i) => {
    num += (i - xm) * (y - ym);
    den += (i - xm) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

export function computeBaselines(history: Reading[]): Record<string, Band> {
  const win = history.filter((r) => r.day >= BASELINE_WINDOW.from && r.day <= BASELINE_WINDOW.to);
  const bands: Record<string, Band> = {};
  for (const s of SIGNALS) {
    const pts = win
      .map((r) => ({ day: r.day, x: Number((r as Record<string, unknown>)[s.key]) }))
      .filter((p) => Number.isFinite(p.x));
    if (pts.length === 0) continue;
    const centerDay = mean(pts.map((p) => p.day));
    const raw = mean(pts.map((p) => p.x));
    const slopePerDay = s.expectedPerDay ?? ((s.expectedPctPerDay ?? 0) / 100) * raw;
    // remove the expected in-flight change before measuring the person's normal spread
    const resid = pts.map((p) => p.x - slopePerDay * (p.day - centerDay));
    const m = mean(resid);
    const d = Math.max(sd(resid), s.minSd);
    bands[s.key] = { mean: m, sd: d, lo: m - 2 * d, hi: m + 2 * d, nDays: pts.length, centerDay, expectedPerDay: slopePerDay };
  }
  return bands;
}

/** Drift for every signal on `day`, using only data up to that day. */
export function computeDrift(history: Reading[], bands: Record<string, Band>, day: number): Record<string, Drift> {
  const upTo = history.filter((r) => r.day <= day).sort((a, b) => a.day - b.day);
  const out: Record<string, Drift> = {};
  if (upTo.length === 0) return out;
  const today = upTo[upTo.length - 1];
  const last3 = upTo.slice(-3);
  const last7 = upTo.slice(-7);

  for (const [key, band] of Object.entries(bands)) {
    const def = SIGNAL_BY_KEY[key];
    const get = (r: Reading) => Number((r as Record<string, unknown>)[key]);
    // Event-like signals (radiation, sleep, reaction) use today's value, slow ones use a 3-day average
    const fast = ["radiation_mSv_today", "sleep_hours", "reaction_time_ms", "memory_score"].includes(key);
    const value = fast ? get(today) : mean(last3.map(get));
    const at = fast ? today.day : mean(last3.map((r) => r.day));
    const rawZ = (value - expectedAt(band, at)) / band.sd;
    const rawTrend = ((slope(last7.map(get)) - band.expectedPerDay) * 7) / band.sd;
    const dir = def.badDirection;
    const z = dir === 0 ? Math.abs(rawZ) : dir * rawZ;
    const trend = dir === 0 ? Math.abs(rawTrend) : dir * rawTrend;
    const score = Math.max(z, z + 0.25 * Math.max(0, trend));
    out[key] = { signal: key, value, z, trendPerWeek: trend, score, stale: today.day < day };
  }
  return out;
}

export function signalLevel(score: number): "Nominal" | "Watch" | "Act" {
  // DEMO thresholds
  if (score >= 3) return "Act";
  if (score >= 2) return "Watch";
  return "Nominal";
}
