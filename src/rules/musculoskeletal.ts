import type { CouplingRule } from "./types.ts";

// Unloading drives muscle and bone loss together; less exercise speeds both.
// Bone density and calf volume already allow for the normal in-flight decline (see signals.ts),
// so this only rises when someone is losing FASTER than the published rates.
export const musculoskeletal: CouplingRule = {
  id: "musculoskeletal",
  name: "Musculoskeletal decline",
  signals: { exercise_min: 0.8, body_mass_kg: 0.6, bone_density_pct: 1, calf_volume_pct: 1 },
  minLinked: 2,
  why: "Unloading drives muscle and bone loss together",
  source: "Trappe et al.; NASA risk of bone change",
  action: {
    watch: "Add one resistance session this week; check the load on the exercise device.",
    act: "Adjusted resistance plan for today; review with the flight surgeon.",
  },
  bodyParts: ["bones", "muscles"],
};
