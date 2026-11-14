// Body-map regions: which engine signals and coupled risks each anatomical region shows.
// Pure config, no React, no Vite imports (so scripts/check_bodymap.ts can load it under Node).
//
// - signalIds: SignalDefs in src/engine/signals.ts; they get a personal baseline band.
// - driverIds: SignalDefs that DRIVE a region's risk but are not a direct reading of it
//   (e.g. sleep debt drives immune strain). Shown, labelled as drivers, never colour the region.
// - rawSignalIds: fields in data/crew_sim.json with NO SignalDef, so no baseline: raw value only.
// - riskIds: COUPLING_RULES ids in src/rules. The engine (evaluateRisks) is the only source of risk.
// - missingInputs: things a clinician would want here that HALO has NO data for ("not monitored").
// - whySpace / sources: copied verbatim from src/ui/systems.ts (SYSTEMS[].why / .source) or from the
//   rule files' `why` / `source` strings. Nothing new is cited here.

export type RegionId =
  | "brain"
  | "eyes"
  | "heart"
  | "vessels"
  | "lungs"
  | "kidneys"
  | "gut"
  | "skeleton"
  | "muscles"
  | "skin_immune"
  | "whole_body";

export type View = "anterior" | "posterior";

export type RegionDef = {
  id: RegionId;
  name: string;
  signalIds: string[];
  driverIds: string[];
  rawSignalIds: string[];
  riskIds: string[];
  views: View[];
  missingInputs: string[];
  plainExplanation: string;
  whySpace: string;
  sources: string[];
};

export const REGIONS: RegionDef[] = [
  {
    id: "brain",
    name: "Brain and sleep",
    signalIds: ["sleep_hours", "sleep_debt_h", "mood_1to5", "stress_1to5", "reaction_time_ms", "memory_score"],
    driverIds: [],
    rawSignalIds: [],
    riskIds: ["cognitive_readiness", "immune_strain", "solar_storm"],
    views: ["anterior", "posterior"],
    missingInputs: ["workload"],
    plainExplanation: "Sleep, mood, stress and two short performance tests (reaction time and memory). Together they show how ready you are for demanding tasks such as a spacewalk.",
    // systems.ts: mind
    whySpace: "ISS crews get about 6 h of the 8.5 h scheduled. One night without sleep slowed vigilance and accuracy in NASA analog crews.",
    sources: ["Barger et al. 2014; Nasrini et al. 2020"],
  },
  {
    id: "eyes",
    name: "Eyes",
    signalIds: [],
    driverIds: [],
    rawSignalIds: [],
    riskIds: ["fluid_shift"],
    views: ["anterior"],
    // = the fluid_shift rule's `needs`
    missingInputs: ["vision check score", "headache log", "puffy face check"],
    plainExplanation: "HALO has no direct eye reading. The eyes light up only when the fluid shift risk, judged from blood pressure and heart rate, rises.",
    // systems.ts: eyes
    whySpace: "About 66% of long-duration astronauts show early signs of SANS, caused by fluid shifting toward the head.",
    sources: ["NASA NTRS, SANS brief"],
  },
  {
    id: "heart",
    name: "Heart",
    signalIds: ["heart_rate", "bp_sys", "bp_dia"],
    driverIds: [],
    rawSignalIds: [],
    riskIds: ["fluid_shift"],
    views: ["anterior"],
    missingInputs: ["ECG rhythm"],
    plainExplanation: "Resting heart rate and blood pressure, compared with your own normal in flight.",
    // systems.ts: heart
    whySpace: "Fluid shifts change blood pressure and flow. 6 of 11 ISS crew had stagnant or reversed neck-vein flow; one had a clot.",
    sources: ["Marshall-Goebel et al. 2019"],
  },
  {
    id: "vessels",
    name: "Blood vessels",
    signalIds: ["bp_sys", "bp_dia"],
    driverIds: [],
    rawSignalIds: ["plasma_volume_change_pct"],
    riskIds: ["fluid_shift"],
    views: ["anterior", "posterior"],
    missingInputs: ["neck-vein flow scan"],
    plainExplanation: "Blood pressure and the change in blood plasma volume. In weightlessness, fluid moves from the legs toward the head and neck.",
    // fluidShift rule `why`
    whySpace: "One headward fluid shift drives both SANS and neck-vein stasis",
    sources: ["Marshall-Goebel et al. 2019"],
  },
  {
    id: "lungs",
    name: "Lungs and oxygen",
    signalIds: ["spo2"],
    driverIds: [],
    rawSignalIds: [],
    riskIds: [],
    views: ["anterior", "posterior"],
    missingInputs: ["breathing rate"],
    plainExplanation: "Blood oxygen saturation. No coupled risk rule covers the lungs yet, so only the reading itself is shown.",
    // systems.ts: lungs
    whySpace: "Blood oxygen shows whether cabin air and your lungs keep up. HALO flags drops against your own normal, not an Earth range.",
    sources: ["Demo threshold (HALO)"],
  },
  {
    id: "kidneys",
    name: "Kidneys",
    signalIds: ["fluid_intake_ml", "urine_color_1to8", "sodium_mg"],
    driverIds: [],
    rawSignalIds: [],
    riskIds: ["kidney_stone"],
    views: ["anterior", "posterior"],
    missingInputs: ["urine calcium", "urine volume"],
    plainExplanation: "How much you drink, urine colour and salt intake. Low fluid concentrates the calcium your bones release in flight.",
    // systems.ts: kidneys
    whySpace: "Kidney stones are 2 to 7 times more common after flight. Low fluid plus calcium released from bone drives the risk.",
    sources: ["Siew et al. 2024"],
  },
  {
    id: "gut",
    name: "Gut and nutrition",
    signalIds: ["kcal_eaten", "body_mass_kg", "vitamin_d_ng_ml"],
    driverIds: [],
    rawSignalIds: [],
    // rules whose bodyParts include "gut"
    riskIds: ["under_fuelling", "solar_storm"],
    views: ["anterior"],
    missingInputs: ["appetite and GI symptoms log"],
    plainExplanation: "Calories eaten, body mass and vitamin D: whether you are taking in enough to protect bone and muscle.",
    // systems.ts: gut
    whySpace: "ISS crews ate about 80% of the energy they needed, and vitamin D falls with no sunlight.",
    sources: ["Smith et al., NASA"],
  },
  {
    id: "skeleton",
    name: "Skeleton",
    signalIds: ["bone_density_pct", "bone_resorption_index"],
    driverIds: [],
    rawSignalIds: [],
    riskIds: ["kidney_stone", "musculoskeletal", "under_fuelling", "solar_storm"],
    views: ["anterior", "posterior"],
    missingInputs: ["bone scan"],
    plainExplanation: "Bone density and a bone breakdown marker. The band already allows for the bone loss every astronaut has in flight, so only faster-than-expected loss shows.",
    // systems.ts: bones
    whySpace: "Weight-bearing bones like hip and spine lose 1 to 1.5% density per month without load.",
    sources: ["NASA; National Academies"],
  },
  {
    id: "muscles",
    name: "Muscles",
    signalIds: ["calf_volume_pct", "exercise_min"],
    driverIds: [],
    rawSignalIds: ["resistance_load_kg"],
    riskIds: ["musculoskeletal"],
    views: ["anterior", "posterior"],
    missingInputs: ["strength test"],
    plainExplanation: "Calf muscle volume and daily exercise. Calves and thighs lose the most muscle without gravity.",
    // systems.ts: muscles
    whySpace: "Calf volume fell 13% and peak power 32% after 6 months on the ISS, despite daily exercise.",
    sources: ["Trappe et al."],
  },
  {
    id: "skin_immune",
    name: "Skin and immune",
    signalIds: [],
    // the immune_strain rule's signals: they drive the risk, they are not a skin reading
    driverIds: ["sleep_debt_h", "stress_1to5", "mood_1to5"],
    rawSignalIds: [],
    riskIds: ["immune_strain"],
    views: ["anterior", "posterior"],
    // = the immune_strain rule's `needs`
    missingInputs: ["skin symptoms", "cold sores"],
    plainExplanation: "HALO has no direct skin or immune reading. Sleep debt, stress and mood are shown because they drive the immune strain risk.",
    // immuneStrain rule `why`
    whySpace: "Stress hormones let latent viruses wake up",
    sources: ["Rooney et al. 2019"],
  },
  {
    id: "whole_body",
    name: "Whole body",
    signalIds: ["temp_c", "glucose_mg_dl", "body_mass_kg", "kcal_eaten", "vitamin_d_ng_ml", "radiation_mSv_today"],
    driverIds: [],
    rawSignalIds: ["radiation_mSv_total"],
    riskIds: ["solar_storm", "under_fuelling"],
    views: ["anterior", "posterior"],
    missingInputs: [],
    plainExplanation: "Signals that belong to the whole body rather than one organ: temperature, blood sugar, body mass, energy, vitamin D and radiation dose.",
    // solarStorm + underFuelling rule `why`
    whySpace: "Solar particle events spike the dose fast. Low energy intake speeds bone and muscle loss.",
    sources: ["SwRI MSL RAD; NASA OSDR RadLab", "Smith et al., NASA"],
  },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionId, RegionDef>;

/** Every region a coupled risk touches (from this config, so map and panel always agree). */
export function regionsForRisk(riskId: string): RegionId[] {
  return REGIONS.filter((r) => r.riskIds.includes(riskId)).map((r) => r.id);
}
