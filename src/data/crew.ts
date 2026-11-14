// Loads the simulated crew data once. Field names are the shared contract in src/engine/types.ts.
import raw from "../../data/crew_sim.json";
import type { CrewMember, MissionProfile, Reading, SimData } from "../engine/types.ts";

export const SIM = raw as unknown as SimData;

/** The demo story is told on mission day 58 (after the planted day-55 fluid drop). */
export const DEMO_DAY = 58;

export const MISSION_PROFILE = (SIM.meta.mission_profile as MissionProfile) ?? "mars_transit";

export const crewById = (id: string): CrewMember => SIM.crew.find((c) => c.id === id) ?? SIM.crew[0];

export const historyOf = (crewId: string): Reading[] =>
  SIM.readings.filter((r) => r.crew_id === crewId).sort((a, b) => a.day - b.day);

export const readingOn = (crewId: string, day: number): Reading | undefined =>
  SIM.readings.find((r) => r.crew_id === crewId && r.day === day);
