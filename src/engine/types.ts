// Shared types for the HALO engine. Field names match data/crew_sim.json.

export type CrewMember = {
  id: string;
  name: string;
  role: string;
  age: number;
  sex: "F" | "M";
  baseline: Record<string, number>; // pre-flight values
};

export type Reading = {
  crew_id: string;
  day: number;
  heart_rate: number;
  bp_sys: number;
  bp_dia: number;
  temp_c: number;
  spo2: number;
  glucose_mg_dl: number;
  sleep_hours: number;
  sleep_med_taken: boolean;
  sleep_debt_h: number;
  mood_1to5: number;
  stress_1to5: number;
  fluid_intake_ml: number;
  urine_color_1to8: number;
  sodium_mg: number;
  plasma_volume_change_pct: number;
  bone_density_pct: number;
  bone_resorption_index: number;
  calf_volume_pct: number;
  exercise_min: number;
  resistance_load_kg: number;
  body_mass_kg: number;
  kcal_eaten: number;
  vitamin_d_ng_ml: number;
  radiation_mSv_today: number;
  radiation_mSv_total: number;
  in_storm_shelter: boolean;
  reaction_time_ms: number;
  memory_score: number;
  eva_scheduled: boolean;
  events: string[];
};

export type SimData = {
  meta: Record<string, unknown>;
  crew: CrewMember[];
  readings: Reading[];
};

export type Level = "Nominal" | "Watch" | "Act";

export type MissionProfile = "iss" | "moon" | "mars_transit";
