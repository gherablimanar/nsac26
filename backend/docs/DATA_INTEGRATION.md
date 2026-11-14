# Existing repository data

Use the existing root files rather than creating a second source of truth:

- `data/crew_sim.json`: crew profiles, pre-flight reference values, daily records and metadata.
- `data/crew_sim.csv`: flat representation of those daily records.
- `scripts/crew_simulator.py`: seeded synthetic generation and planted events.
- `src/engine/types.ts`: current TypeScript field names and types.
- `src/engine/baseline.ts`: existing adaptation-relative scoring implementation.

The current snapshot contains three fictional crew members and 120 days each,
360 records total. It is not measured astronaut telemetry or clinical training data.
The adapter is planned, not implemented in this branch.

## Mapping requirements

Preserve names such as `heart_rate`, `bp_sys`, `glucose_mg_dl`, `sleep_hours`,
`fluid_intake_ml`, `reaction_time_ms`, and `radiation_mSv_today`. Every future API
measurement also needs a unit, source/provenance, observation time and quality state.

The simulator supplies mission-day numbers rather than actual observation timestamps.
Use explicit scenario time with a simulation label; never invent a real sensor time.
`bone_resorption_index` is an arbitrary demo index, not a standardized lab result.
Keep pre-flight reference values distinct from the current scorer's day 7–20 adaptation
window. Missing or stale data must not become a normal/healthy result.

## Useful acceptance scenarios for the future adapter

| Input | Expected demonstration |
|---|---|
| All crew, days 40–41 | Planted radiation spike |
| C2, day 55 onward | Lower fluid intake with rising simulated bone marker |
| C3, day 70 | Short sleep and slower reaction time before a scheduled EVA |

These scenarios can verify software behavior, not clinical sensitivity or benefit.

## NASA integration planned next

RadLab guide: https://visualization.osdr.nasa.gov/radlab/gui/data-api/

Keep instrument, location, original quantity/unit, observation time, fetch time and
cache freshness. Absorbed dose rate in microgray/hour is not interchangeable with
the simulator's millisievert/day fields. No automatic Gy-to-Sv conversion or assignment
of an instrument observation to an individual's dose should be implied.
