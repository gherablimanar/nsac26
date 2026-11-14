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
data/        RadLab radiation snapshot + simulated crew data
scripts/     crew simulator (3 crew × 120 days, planted demo events)
src/rules/   coupling rules, one file per rule, each with its citation
backend/     tiny server that holds the AI API key + caches RadLab data
```

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
| Coupling rule thresholds | Demo parameters | Our own, labelled as such |

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
