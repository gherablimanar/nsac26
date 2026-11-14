// Gurman's 7 coupling rules, in the order the Evidence page lists them.
import { kidneyStone } from "./kidneyStone.ts";
import { fluidShift } from "./fluidShift.ts";
import { cognitiveReadiness } from "./cognitiveReadiness.ts";
import { musculoskeletal } from "./musculoskeletal.ts";
import { immuneStrain } from "./immuneStrain.ts";
import { underFuelling } from "./underFuelling.ts";
import { solarStorm } from "./solarStorm.ts";
import type { CouplingRule } from "./types.ts";

export const COUPLING_RULES: CouplingRule[] = [
  kidneyStone,
  fluidShift,
  cognitiveReadiness,
  musculoskeletal,
  immuneStrain,
  underFuelling,
  solarStorm,
];

export type { CouplingRule, RiskResult, Contributor } from "./types.ts";
