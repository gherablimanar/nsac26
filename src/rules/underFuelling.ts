import type { CouplingRule } from "./types.ts";

// Low energy intake speeds bone and muscle loss. Body mass and vitamin D already allow for
// the normal in-flight decline (see signals.ts).
export const underFuelling: CouplingRule = {
  id: "under_fuelling",
  name: "Under-fuelling",
  signals: { kcal_eaten: 1, body_mass_kg: 1, vitamin_d_ng_ml: 0.8 },
  minLinked: 2,
  why: "Low energy intake speeds bone and muscle loss",
  source: "Smith et al., NASA",
  action: {
    watch: "Meal nudge: add a snack today; take the vitamin D supplement.",
    act: "Meal plan review with the crew medical officer; daily body mass check.",
  },
  bodyParts: ["gut", "bones"],
};
