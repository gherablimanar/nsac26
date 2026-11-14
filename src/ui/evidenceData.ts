// MOCK: reference content for the Evidence page. Thresholds are demo parameters.

export type Rule = { name: string; combines: string; why: string; action: string; source: string };

export const RULES: Rule[] = [
  { name: "Kidney stone risk", combines: "bone loss trend, fluid intake, urine colour, sodium intake", why: "Bone calcium plus low fluid plus kidney remodelling", action: "Raise fluid intake, cut sodium, flag to the crew medical officer", source: "Siew et al. 2024" },
  { name: "Fluid shift syndrome", combines: "headache, puffy face, vision check score, days in flight", why: "One headward fluid shift drives both SANS and neck-vein stasis", action: "Weekly vision self-test, report blurred vision at once", source: "NASA NTRS SANS brief; Marshall-Goebel et al. 2019" },
  { name: "Cognitive readiness", combines: "sleep hours, reaction time test, radiation dose today, workload", why: "Sleep loss and stress slow vigilance; radiation adds risk", action: "Go, caution or no-go before a spacewalk or docking", source: "Nasrini et al. 2020; Barger et al. 2014" },
  { name: "Musculoskeletal decline", combines: "exercise minutes, resistance load, body mass, days in flight", why: "Unloading drives muscle and bone loss together", action: "Adjusted resistance plan for today", source: "Trappe et al.; NASA risk of bone change" },
  { name: "Immune strain", combines: "sleep, stress check-in, skin symptoms, cold sores", why: "Stress hormones let latent viruses wake up", action: "Rest first, hygiene, log symptoms", source: "Rooney et al. 2019" },
  { name: "Under-fuelling", combines: "calories logged, body mass trend, vitamin D", why: "Low energy intake speeds bone and muscle loss", action: "Meal nudge, vitamin D reminder", source: "Smith et al., NASA" },
  { name: "Solar storm exposure", combines: "radiation feed, location in the craft, scheduled tasks", why: "Solar particle events spike the dose fast", action: "Move to the shielded shelter, delay the spacewalk", source: "SwRI MSL RAD; NASA OSDR RadLab" },
];

export const DATA_ROWS: { data: string; status: string; source: string }[] = [
  { data: "ISS radiation dose rate", status: "Real", source: "NASA OSDR RadLab API, cached snapshot" },
  { data: "Mars and Moon dose rates", status: "Real numbers, applied by us", source: "MSL RAD, 1.8 mSv per day in cruise" },
  { data: "Biomarker baseline ranges", status: "Real ranges", source: "OSDR Inspiration4 datasets" },
  { data: "Rates of bone, muscle, fluid and sleep change", status: "Real published rates", source: "The papers above" },
  { data: "Three crew members and their daily readings", status: "Simulated", source: "Crew simulator built from the real rates, with planted events" },
  { data: "Coupling rule thresholds", status: "Demo parameters", source: "Our own, labelled as such" },
];

export const NASA_DATA: { name: string; use: string }[] = [
  { name: "NASA OSDR", use: "biomarker ranges for the simulated crew" },
  { name: "OSDR RadLab", use: "radiation feed and Mars and Moon scenarios" },
  { name: "Human Research Program five hazards", use: "every signal is tagged to one" },
  { name: "Inspiration4 and SOMA", use: "commercial crews need monitoring too" },
  { name: "EIMO concept of operations", use: "HALO is a small working version of it" },
];

export const IMAGE_CREDITS: { name: string; use: string }[] = [
  { name: "Body map", use: "Front and back anatomy drawn as SVG for HALO (src/bodymap). No third-party images." },
];

export const TESTS_TEXT = "20 test questions across body systems, scored on safety (no dose, right escalation), accuracy against the source, and clarity.";
