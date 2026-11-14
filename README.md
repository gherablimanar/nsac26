# HALO — Health Autonomy for Long Operations

**NASA Space Apps Challenge 2026 · "Create Health Monitoring Software for Astronauts on Space Missions"**

On Mars, the doctor is 20 minutes away and the crew medical officer might be the patient. HALO is an offline AI crew medical officer that links signals across body systems, spots coupled risks early, explains them in plain language, and tells the crew what to do next.

> ⚠️ Prototype for a hackathon. **Not a medical device.**

## What makes HALO different
1. **Coupled Risk Engine** — links systems (e.g. bone loss + low fluid + kidney remodelling → kidney stone risk)
2. **Delay-aware AI medical officer** — offline-first, grounded in NASA evidence, never gives drug doses
3. **Personal baseline drift** — compares each astronaut to their own pre-flight baseline
4. **Mission readiness gate** — go / caution / no-go before high-risk tasks like EVAs
5. **Pharmacy potency tracker** — forecasts which onboard medicines are losing strength

## Repo layout
```
data/          RadLab radiation snapshot + simulated crew data (run the simulator to create crew_sim.json)
scripts/       crew_simulator.py (3 crew × 120 days, planted events) + check_engine.ts (tests)
src/engine/    the Coupled Risk Engine: baselines, drift, 7 coupled rules, readiness gate, potency tracker
src/rules/     notes for the rule writers
backend/       tiny server that holds the AI API key + caches RadLab data
```

## The engine (for the UI team)
```ts
import { runEngine } from "./engine/engine.ts";
import { forecastPotency } from "./engine/potency.ts";
import sim from "../data/crew_sim.json";

const report = runEngine(sim, "C2", 60, "mars_transit");
report.risks          // 7 named risks, worst first: level, score + range, contributors, action, citation, "why unsure"
report.bodyMap        // { kidneys: "Act", bones: "Act", mind: "Nominal", ... } -> colour the body map
report.signals        // every signal: value, personal baseline band, drift score, level -> trend charts
report.readinessGate  // GO / CAUTION / NO-GO when a spacewalk is scheduled that day
report.escalation     // signal delay + what "Act" means for this mission profile
forecastPotency(60, 110) // medicine potency forecast (mission day, cumulative mSv)
```
**How it decides (data → interpretation → decision):**
1. **Personal baseline**: each astronaut's own normal band, from days 7–20 in flight.
2. **Expected in-flight change**: bone, muscle, body mass and vitamin D are compared to the decline the *published rates* predict, so normal spaceflight decline is not an alarm. Losing bone *faster than the research says* is.
3. **Drift score**: how many standard deviations a signal sits from that path, plus its 7-day trend (catches slow drift before it crosses a fixed limit).
4. **Coupled rules**: a risk reaches **Act** only when several linked signals drift together. A single signal alone can only reach Watch, which keeps alarm fatigue down.
5. **Uncertainty**: every risk shows a score range and a "Why is HALO unsure?" list (demo thresholds, missing signals, stale data).

**Test it:** `python scripts/crew_simulator.py && node --experimental-strip-types scripts/check_engine.ts` (Node 22.6+).
Checks: solar storm = Act for everyone on day 40 only; C2 kidney stone risk = Act from day 55, never for C1/C3; C3 readiness gate = NO-GO on day 70 while C1/C2 = GO; zero unplanned Act alerts across 300 crew-days.

## Getting started
```bash
git clone https://github.com/leonardoperugia09-cyber/nsac26.git
cd nsac26
npm create vite@latest . -- --template react-ts   # first person only, then commit
npm install
npm run dev
```
Put API keys in a `.env` file (copy `.env.example`). **Never commit `.env`.**

## Team workflow
Make a branch before you code (`git checkout -b yourname-feature`) and merge into `main` with a Pull Request.

## Real vs simulated data
| Data | Real or simulated | Source |
|---|---|---|
| ISS radiation dose rate | Real | OSDR RadLab API (cached snapshot) |
| Mars / Moon dose rates | Real numbers, applied by us | MSL RAD (1.8 mSv/day cruise) |
| Biomarker baseline ranges | Real ranges | OSDR Inspiration4 datasets |
| Rates of bone, muscle, fluid, sleep change | Real published rates | Papers cited in `src/rules/` |
| 3 crew members + daily readings | Simulated | `scripts/` simulator |
| Expected in-flight decline (bone, calf, mass) | Real published rates | NASA / National Academies, Trappe et al., Smith et al. |
| Coupling rule thresholds, drift weights | Demo parameters | Our own, labelled as such |
| Medicine potency model | Demo model on a real finding | Du et al. 2011 (31% vs 54% passed potency after 880 days) |

## Challenge requirements
- [ ] Gathers health indicators and lets astronauts act on them
- [ ] Visual self-assessment tool (clickable body map)
- [ ] Guidance on treatments / health improvements
- [ ] Six named indicators: blood pressure, heart rate, blood sugar, temperature, sleep, mood
- [ ] Which measurements work in space, and why each matters
- [ ] How spaceflight hazards affect each indicator
- [ ] When to involve crew / flight surgeons
- [ ] Preventive actions

## AI agent test results
_20-question safety / accuracy / clarity eval — to be added._
