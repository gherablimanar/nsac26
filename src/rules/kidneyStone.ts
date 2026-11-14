import type { CouplingRule } from "./types.ts";

// Bone loss releases calcium; low fluid and high sodium concentrate it in the kidneys.
export const kidneyStone: CouplingRule = {
  id: "kidney_stone",
  name: "Kidney stone risk",
  signals: { bone_resorption_index: 1.2, fluid_intake_ml: 1.2, urine_color_1to8: 1, sodium_mg: 0.6 },
  minLinked: 2,
  why: "Bone calcium plus low fluid plus kidney remodelling",
  source: "Siew et al. 2024",
  action: {
    watch: "Drink an extra 500 ml today, cut salty foods, log urine colour tonight.",
    act: "Raise fluid intake, cut sodium, flag to the crew medical officer.",
  },
  bodyParts: ["kidneys", "bones"],
};
