"""
HALO crew simulator
-------------------
Generates 120 days of daily health data for 3 fictional crew members on a
Mars transit, using real published spaceflight rates, plus 3 planted demo events.

Run:   python scripts/crew_simulator.py
Output: data/crew_sim.json  (crew baselines + daily readings)
        data/crew_sim.csv   (same daily readings, flat, for quick checks)

Only uses the Python standard library. Same seed = same data every run.

REAL RATES (sources in the README / master plan):
  - Bone density: -1 to -1.5% per month on long missions (NASA, National Academies)
  - Plasma volume: -10 to -20% within 24-48 h of reaching orbit (NASA NTRS)
  - Sleep: 8.5 h scheduled, ~6 h actual (Barger et al. 2014)
  - Radiation: ~1.8 mSv/day in Mars cruise (MSL RAD, SwRI)
  - Calf muscle: -13% volume after 6 months (Trappe et al.)
  - Energy intake: ISS crews ate ~80% of needed energy (Smith et al.)
Anything marked DEMO is our own parameter, not a published number.

PLANTED EVENTS:
  - Day 40-41: solar particle event, everyone's radiation dose spikes
  - Day 55+:   crew member 2 drinks much less while bone markers climb (kidney stone story)
  - Day 70:    crew member 3 sleeps badly the night before a spacewalk (readiness gate story)
"""

import csv
import json
import os
import random

SEED = 42
DAYS = 120
random.seed(SEED)

# ---- Real rates --------------------------------------------------------
BONE_LOSS_PER_MONTH = (1.0, 1.5)    # % per 30 days
PLASMA_DROP = (10, 20)              # % within first 2 days
SLEEP_ACTUAL_MEAN = 6.0             # hours
MARS_CRUISE_DOSE = 1.8              # mSv/day
CALF_LOSS_6_MONTHS = 13.0           # % volume
INTAKE_FRACTION = 0.80              # share of needed energy actually eaten
BP_SHIFT = (-8, -9)                 # mmHg sys/dia, 24-h ambulatory, days 85-192 (Norsk et al. 2015)
TEMP_RISE = 0.6                     # C by day 75, then plateau (Stahn et al. 2017 saw +1.0; low option so it does not read as fever)
MASS_LOSS_FIRST_MONTH = (2.0, 4.0)  # % lost in the first 30 days, then stable (NASA ISS body mass data)
DOSE_SD = 0.2                       # mSv/day day-to-day spread (MSL RAD 1.75 +/- 0.30, Guo et al. 2015)

# ---- Demo parameters (ours, label them as such in the app) -------------
SOLAR_STORM_DAYS = {40: 14.0, 41: 4.0}   # DEMO extra mSv; 18 total, inside what MSL RAD saw per event (1.2-19.5)
FLUID_DROP_START = 55                    # DEMO
FLUID_DROP_CREW = "C2"
SHORT_SLEEP_DAY = 70                     # DEMO
SHORT_SLEEP_CREW = "C3"
EVA_DAY = 70                             # spacewalk scheduled same day

# ---- Fictional crew with personal pre-flight baselines -----------------
CREW = [
    {"id": "C1", "name": "Commander Aiko Sato", "role": "Commander", "age": 44, "sex": "F",
     "baseline": {"heart_rate": 58, "bp_sys": 112, "bp_dia": 72, "temp_c": 36.6, "spo2": 98,
                  "glucose_mg_dl": 88, "body_mass_kg": 61.0, "fluid_ml": 2300, "sodium_mg": 4200,
                  "kcal_need": 2200, "reaction_ms": 255, "vit_d_ng_ml": 38}},
    {"id": "C2", "name": "Flight Engineer Marco Ricci", "role": "Flight Engineer", "age": 38, "sex": "M",
     "baseline": {"heart_rate": 62, "bp_sys": 120, "bp_dia": 78, "temp_c": 36.7, "spo2": 98,
                  "glucose_mg_dl": 92, "body_mass_kg": 78.0, "fluid_ml": 2500, "sodium_mg": 4800,
                  "kcal_need": 2800, "reaction_ms": 245, "vit_d_ng_ml": 34}},
    {"id": "C3", "name": "Medical Officer Lena Okafor", "role": "Crew Medical Officer", "age": 41, "sex": "F",
     "baseline": {"heart_rate": 60, "bp_sys": 116, "bp_dia": 74, "temp_c": 36.6, "spo2": 99,
                  "glucose_mg_dl": 86, "body_mass_kg": 66.0, "fluid_ml": 2200, "sodium_mg": 4000,
                  "kcal_need": 2300, "reaction_ms": 250, "vit_d_ng_ml": 40}},
]


def noise(sd):
    return random.gauss(0, sd)


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def simulate(member):
    b = member["baseline"]
    cid = member["id"]
    bone_rate = random.uniform(*BONE_LOSS_PER_MONTH) / 30   # % per day
    plasma_drop = random.uniform(*PLASMA_DROP)
    calf_rate = CALF_LOSS_6_MONTHS / 180                    # % per day

    bone = 100.0           # % of pre-flight bone density
    calf = 100.0           # % of pre-flight calf volume
    mass_loss = random.uniform(*MASS_LOSS_FIRST_MONTH) / 100
    vit_d = b["vit_d_ng_ml"]
    cum_dose = 0.0
    sleep_debt = 0.0
    rows = []

    for day in range(1, DAYS + 1):
        events = []

        # Fluid shift: plasma falls over first 2 days, then holds
        plasma = -plasma_drop * min(day, 2) / 2 + noise(0.8)

        # Exercise: real crews do ~2 h/day; some days less (DEMO variation)
        exercise_min = clamp(random.gauss(110, 20), 30, 150)
        resistance_kg = clamp(random.gauss(70 if member["sex"] == "M" else 50, 6), 20, 100)
        exercise_factor = 1.25 - 0.5 * (exercise_min / 150)   # DEMO: less exercise -> faster loss

        # Hydration and sodium
        fluid = b["fluid_ml"] + noise(150)
        sodium = b["sodium_mg"] + noise(500)
        if cid == FLUID_DROP_CREW and day >= FLUID_DROP_START:
            fluid = b["fluid_ml"] * 0.55 + noise(100)          # drinks ~45% less
            sodium += 1000                                       # saltier food (DEMO)
            exercise_factor += 0.3                               # skips workouts
            if day == FLUID_DROP_START:
                events.append("fluid_intake_drop")
        urine_color = clamp(round(2 + (b["fluid_ml"] - fluid) / 350 + noise(0.4)), 1, 8)  # 1 pale - 8 dark

        # Bone: real rate x exercise factor; resorption marker rises as bone is lost
        bone -= bone_rate * exercise_factor
        bone_marker = 100 + (100 - bone) * 18 + noise(4)       # DEMO index, 100 = pre-flight
        if cid == FLUID_DROP_CREW and day >= FLUID_DROP_START:
            bone_marker += (day - FLUID_DROP_START + 1) * 2.5    # climbs faster

        calf -= calf_rate * exercise_factor

        # Sleep
        sleep = clamp(random.gauss(SLEEP_ACTUAL_MEAN, 0.6), 4.0, 8.0)
        if cid == SHORT_SLEEP_CREW and day == SHORT_SLEEP_DAY:
            sleep = 3.4
            events.append("short_sleep_before_eva")
        sleep_med = sleep < 5.2 and random.random() < 0.5
        sleep_debt = max(0, sleep_debt * 0.7 + (7.5 - sleep))   # DEMO decay model

        # Radiation
        dose = max(0.8, MARS_CRUISE_DOSE + noise(DOSE_SD))
        in_shelter = False
        if day in SOLAR_STORM_DAYS:
            dose += SOLAR_STORM_DAYS[day]
            in_shelter = True
            if day == min(SOLAR_STORM_DAYS):
                events.append("solar_storm")
        cum_dose += dose

        # Cognition: slows with sleep debt and on high-dose days (DEMO weights)
        last_night_short = max(0, 5.5 - sleep)                   # hours under 5.5 last night
        reaction = b["reaction_ms"] + sleep_debt * 9 + last_night_short * 35 + (dose > 5) * 15 + noise(8)
        memory_score = clamp(round(95 - sleep_debt * 2.5 - last_night_short * 6 + noise(3)), 40, 100)

        # Nutrition: crews eat ~80% of need -> slow mass loss; no UV -> vitamin D falls
        kcal = b["kcal_need"] * INTAKE_FRACTION + noise(120)
        mass = b["body_mass_kg"] * (1 - mass_loss * min(1, day / 30)) + noise(0.25)  # most loss in month 1
        vit_d -= 0.08 + noise(0.02)                                 # DEMO decline per day

        # Vitals
        stress = clamp(round(2 + sleep_debt / 4 + (day in SOLAR_STORM_DAYS) + noise(0.6)), 1, 5)
        mood = clamp(round(4 - sleep_debt / 5 - (stress >= 4) * 0.5 + noise(0.5)), 1, 5)
        row = {
            "crew_id": cid,
            "day": day,
            "heart_rate": round(b["heart_rate"] + 1 + (stress - 2) + noise(2.5)),   # 24-h mean ~unchanged in flight (Norsk 2015)
            "bp_sys": round(b["bp_sys"] + BP_SHIFT[0] * min(1, day / 14) + noise(4)),
            "bp_dia": round(b["bp_dia"] + BP_SHIFT[1] * min(1, day / 14) + noise(3)),
            "temp_c": round(b["temp_c"] + TEMP_RISE * min(1, day / 75) + noise(0.12), 1),  # slow "space fever" rise
            "spo2": round(clamp(b["spo2"] + noise(0.6), 94, 100)),
            "glucose_mg_dl": round(b["glucose_mg_dl"] + noise(6)),
            "sleep_hours": round(sleep, 1),
            "sleep_med_taken": sleep_med,
            "sleep_debt_h": round(sleep_debt, 1),
            "mood_1to5": mood,
            "stress_1to5": stress,
            "fluid_intake_ml": round(fluid),
            "urine_color_1to8": urine_color,
            "sodium_mg": round(sodium),
            "plasma_volume_change_pct": round(plasma, 1),
            "bone_density_pct": round(bone, 2),
            "bone_resorption_index": round(bone_marker, 1),
            "calf_volume_pct": round(calf, 2),
            "exercise_min": round(exercise_min),
            "resistance_load_kg": round(resistance_kg),
            "body_mass_kg": round(mass, 2),
            "kcal_eaten": round(kcal),
            "vitamin_d_ng_ml": round(vit_d, 1),
            "radiation_mSv_today": round(dose, 2),
            "radiation_mSv_total": round(cum_dose, 1),
            "in_storm_shelter": in_shelter,
            "reaction_time_ms": round(reaction),
            "memory_score": memory_score,
            "eva_scheduled": day == EVA_DAY,
            "events": events,
        }
        rows.append(row)
    return rows


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, "data")
    os.makedirs(out_dir, exist_ok=True)

    readings = []
    for m in CREW:
        readings.extend(simulate(m))

    out = {
        "meta": {
            "mission_profile": "mars_transit",
            "days": DAYS,
            "seed": SEED,
            "simulated": True,
            "note": "Fictional crew. Rates from published NASA research; values marked DEMO in the script are our own.",
            "planted_events": {
                "solar_storm": {"day": 40, "crew": "all"},
                "fluid_intake_drop": {"day": FLUID_DROP_START, "crew": FLUID_DROP_CREW},
                "short_sleep_before_eva": {"day": SHORT_SLEEP_DAY, "crew": SHORT_SLEEP_CREW},
            },
        },
        "crew": CREW,
        "readings": readings,
    }
    with open(os.path.join(out_dir, "crew_sim.json"), "w") as f:
        json.dump(out, f, indent=1)

    with open(os.path.join(out_dir, "crew_sim.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(readings[0].keys()))
        w.writeheader()
        for r in readings:
            w.writerow({**r, "events": ";".join(r["events"])})

    print(f"Wrote {len(readings)} daily readings for {len(CREW)} crew to data/crew_sim.json and data/crew_sim.csv")


if __name__ == "__main__":
    main()
