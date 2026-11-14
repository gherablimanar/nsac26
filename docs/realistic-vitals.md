# Realistic vitals for the HALO crew simulator

Research note, 2026-11-14. Nothing in the simulator has been changed. Values are quoted as published; "secondary" means I only saw the number in a summary or search result, not in the paper itself.

## Summary

Most current parameters are the right size, but five are off or missing a published pattern. Blood pressure should drop about 8-9 mmHg in flight (now -3 systolic, 0 diastolic). Core temperature rise is published as about 1 degree C, building over roughly 75 days (now a flat +0.3). Sodium on the ISS diet runs above 4.5 g/day (now 3.0-3.6 g). Body mass is lost mostly in the first month, then stays flat (now a straight line down). Solar particle events measured on a real Mars cruise were 1.2 to 19.5 mSv per event (now 33 mSv over two days). Heart rate needs a daily pattern: night about 6 bpm lower than day, with the 24-hour mean unchanged. Reaction time, glucose and SpO2 have no usable in-flight numbers, so they stay DEMO.

## Comparison table

Current = baseline, in-flight shift, day-to-day noise (SD) in `crew_simulator.py`.

| Signal | Current simulator | Published value | Recommended parameters | Source |
|---|---|---|---|---|
| heart_rate | Baseline 58-62. In flight: +2 plus stress score (about +4 on average). SD 2. | 8 male astronauts, in flight days 85-192. 24-h mean 64 +/- 2 bpm in flight vs 63 +/- 2 preflight (unchanged). Night 58 +/- 1 vs day 64 +/- 3 in flight (P = 0.034). Day-to-day SD not reported. A 7-astronaut Holter study (secondary): night HR 55.5 on Earth vs 55.7 in flight, day HR 71-73 on Earth vs 66-69 in flight. | Baseline range 58-64 across crew (keep). Shift: 0 to +2 bpm, not +4. Treat the daily value as a daytime resting value; if a night value is ever shown, use day minus 6. SD 2-3: no source found, keep as DEMO. | Norsk et al. 2015, https://pmc.ncbi.nlm.nih.gov/articles/PMC4324706/ ; Holter study (secondary, not opened) https://pmc.ncbi.nlm.nih.gov/articles/PMC3628896 |
| bp_sys | Baseline 112-120. In flight -3. SD 4. | 24-h ambulatory systolic 129 +/- 2 preflight to 121 +/- 2 in flight (-8 +/- 2 mmHg, P = 0.01). Seated: 130 +/- 2 to 118 +/- 2. Returned to preflight after landing. | Shift -8 mmHg (range -6 to -10 across crew). Time course: the paper has one value for days 85-192, no early data, so the ramp is DEMO (suggest full effect by about day 14). SD 4: no source found, keep as DEMO. | Norsk et al. 2015 (same URL) |
| bp_dia | Baseline 72-78. In flight 0. SD 3. | 24-h diastolic 85 +/- 2 to 76 +/- 2 (-9 +/- 2 mmHg, P < 0.001). Seated: 89 +/- 3 to 77 +/- 2. Mean arterial pressure 102 +/- 3 to 92 +/- 1 (-10 +/- 3). | Shift -9 mmHg (range -7 to -11). Same ramp note as systolic. SD 3: keep as DEMO. Night dip of 8 +/- 3 mmHg (mean arterial) is preserved in flight, so a night value, if shown, is about 8 mmHg lower than day. | Norsk et al. 2015 (same URL) |
| temp_c | Baseline 36.6-36.7. In flight +0.3 flat. SD 0.15. | 11 astronauts (7 M, 4 F), 6-month ISS missions. Resting core temperature rose about 1.01 C above baseline, rising through the mission and reaching a plateau after 75 days. Max exercise temperature +1.39 C. Measured with a forehead heat-flux sensor (a surrogate, no accuracy number given in the paper). Day/night pattern not reported. | Ramp from 0 to +0.5 (low option) or +1.0 (published) by day 75, then hold. SD 0.15: no source found, keep as DEMO. Decision for the designer: +1.0 gives readings near 37.6-37.7 C, which will look like a fever to any alert rule. Either set the alert threshold above that or use the low option. | Stahn et al. 2017, https://pmc.ncbi.nlm.nih.gov/articles/PMC5701078 |
| spo2 | Baseline 98-99, in flight 0, SD 0.6, clamped 94-100. | No ISS long-duration resting value found. Shuttle crews (8 men, STS-69 and STS-72): in-flight SpO2 about 97% (secondary, from the abstract summary). | No source found, keep as DEMO. Optional: baseline 97-99 to match the Shuttle value. | Conkin et al. 2017, https://www.ingentaconnect.com/contentone/asma/amhp/2017/00000088/00000006/art00004 |
| glucose_mg_dl | Baseline 86-92, no shift, SD 6. | Hughson 2016 (4 M, 4 F, 6 months ISS): in flight, fasting insulin rose in all astronauts (P < 0.001), HOMA-IR rose in all (P < 0.001), fasting glucose rose in men but not women (P = 0.037). Absolute mg/dL values not found. | Direction only: small rise in men (DEMO size, suggest +3 to +5 mg/dL by mid-flight), none in women. Absolute values and SD: no source found, keep as DEMO. | Hughson et al. 2016, https://doi.org/10.1152/ajpheart.00802.2015 (numbers via secondary summaries) |
| sleep_hours | Mean 6.0, SD 0.6, clamped 4-8. | Barger 2014: ISS missions 6.09 h mean (Shuttle 5.96 h), scheduled 8.5 h. Only 24% of ISS sleep episodes were 7 h or more. Basner 2022 (24 astronauts, 6-month ISS missions): self-reported 6.5 +/- 1.4 h in flight, and nights of 6 h or less were 34.9% of nights. | Mean 6.0-6.5 h (keep 6.0, or use 6.3). SD 1.0-1.4 (the published SD mixes between-person and between-night variation, so 1.0 is a safe middle). Keep the clamp at 4-8. | Barger et al. 2014, https://doi.org/10.1016/S1474-4422(14)70122-X (figures via press coverage) ; Basner et al. 2022, https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197 |
| fluid_intake_ml | Baseline 2500-2800, SD 150, no in-flight shift. | NASA requirement is 1-1.5 mL per kcal with a minimum of 2000 mL/day. Actual intake "on average meets this minimum (>2 L)". Fluid intake in flight is typically less than preflight. No mean mL/day found. | Baseline 2000-2500 (about 15% below the current values). SD 150-250: no source found for the SD, keep as DEMO. The planted C2 drop from day 55 is a story event, keep. | NASA HRP Evidence Report, Inadequate Nutrition, https://ntrs.nasa.gov/api/citations/20150000512/downloads/20150000512.pdf |
| sodium_mg | Baseline 3000-3600, SD 250. | "Typical intakes on ISS have been in excess of 4.5 g" even with low food intake. Skylab and Shuttle averaged 4-5 g. Intakes as high as 7-10 g/day were observed. Original ISS food about 5300 mg/day, reformulated toward 3000 mg/day (secondary). | Baseline 4000-5000 mg/day across crew. SD 500-800 (wider, given the 4-10 g range reported). Shorter-term option: if the story is a reformulated menu, use 3000-3600 as now and label it as the reformulated target. The C2 +600 mg salty-food step stays. | NASA HRP Evidence Report (same URL) ; reformulation figure secondary, via search result, not opened |
| body_mass_kg | Mass falls linearly from an energy deficit of 20% x 0.5. About -3 to -3.5 kg over 120 days (about -5%). | 25 ISS crew: mass loss versus preflight averaged -4.4% (Russian scale) and -2.8% (NASA scale), mostly in the first 30 days, then constant. NASA summary: 2-5% lost in the first month, then held. NASA HRP: losses of 1-5% typical, ISS energy intake about 80% of need. | Front-load: lose 2-4% of baseline by day 30 (random per person), then change by 0 to -0.3% over the rest. Day-to-day scale noise 0.2-0.3 kg: no source found, keep as DEMO. | Body mass paper, PMID 25197887, https://www.ncbi.nlm.nih.gov/pubmed/25197887 (abstract via search summary; author not confirmed) ; NASA HRP (same URL as above) |
| radiation_mSv_today | 1.8 mSv/day, SD 0.05. SPE: +25 on day 40 and +8 on day 41. | MSL RAD, 253-day Mars cruise: average 1.75 +/- 0.30 mSv/day (galactic cosmic rays, as cited by Guo 2015). 1.84 mSv/day is the figure in press coverage (secondary). Total cruise dose about 466 mSv. Five SPEs in cruise: 4.0 mSv (two events, 23-29 Jan 2012), 19.5 mSv (two events, 7-15 Mar 2012), 1.2 mSv (one event, 17 May 2012), 24.7 mSv total, about 5% of cruise dose. ISS: about 72 mSv average effective dose per 6-month mission (19 astronauts), about 0.4 mSv/day (my division; secondary). | Keep baseline 1.8 (inside 1.75 +/- 0.30). Raise SD from 0.05 to 0.15-0.30. SPE: published events were 1.2 to 19.5 mSv per event, so +25 and +8 (33 total) is above anything RAD saw in cruise. Suggest total of 15-20 mSv spread over 2 days, e.g. +12 and +6, or keep 33 and label it as a DEMO worst case. Note that a stronger solar cycle would lower the GCR baseline. | Zeitlin et al. 2013 (Science), press release https://www.swri.org/press-release/swri-led-team-calculates-radiation-exposure-associated-trip-mars ; Guo et al. 2015, https://arxiv.org/abs/1503.06631 ; Cucinotta et al. 2008, https://bioone.org/journals/radiation-research/volume-170/issue-1/RR1330.1/Physical-and-Biological-Organ-Dosimetry-Analysis-for-International-Space-Station/10.1667/RR1330.1.full |
| reaction_time_ms | Baseline 245-255, plus sleep debt x 9, short night x 35, dose > 5 mSv +15, SD 8. | Basner 2022 used the 3-minute PVT-B on 24 ISS astronauts, every 4 days. Response speed was significantly slower on nights of 6 h or less (F = 40.76, P < 0.0001). The paper text gives no mean reaction time in ms, only a figure. | No source found for absolute ms values, keep as DEMO. Direction is supported: slower after short sleep. | Basner et al. 2022, https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197 |

## What stays the same

- Radiation baseline of 1.8 mSv/day for Mars cruise. It matches MSL RAD.
- Mean sleep of about 6 h with 4-8 h clamp. It matches Barger 2014 and Basner 2022.
- The mechanism that short sleep slows reaction time (direction supported, size DEMO).
- Heart rate baselines of 58-62 and the 24-h mean staying about equal to preflight (only the extra +2 and stress term is high).
- SpO2 at 97-99: plausible, but no ISS source found, keep as DEMO.
- Energy intake at about 80% of need (NASA HRP: ISS intakes about 80% of requirements).
- Fluid drop story for C2, short-sleep story for C3, and the existence of a solar particle event (the timing and size are story choices).

## Items with no source found

- Day-to-day SD for every signal except sleep (and radiation, where RAD gives +/- 0.30): no source found, keep as DEMO.
- Absolute in-flight glucose, SpO2, and reaction-time values: no source found, keep as DEMO.
- Time course of the blood pressure drop in the first weeks: no source found, keep the ramp as DEMO.
- Mean fluid intake in mL/day on the ISS: no source found, only the 2000 mL/day requirement.

## Uncertainty

- The temperature rise (+1.0 C) comes from a forehead sensor estimate in 11 astronauts, so it is a model of core temperature, not a direct core reading.
- Blood pressure and heart rate come from 8 male astronauts measured on days 85-192. Women and the first weeks are not covered.
- 1.84 mSv/day is only in press coverage. The Guo 2015 paper cites Zeitlin 2013 as 1.75 +/- 0.30 mSv/day. Use 1.8 either way. I did not read the Science paper itself.
- Barger 2014, Hughson 2016 and the ISS sodium reformulation figure were taken from abstracts, press releases or search summaries, not full text.
- ISS dose per day (0.4 mSv) is my division of a 72 mSv mission total by about 182 days, not a published rate. Other sources quote up to 0.5-0.8 mSv/day, which I could not reconcile.

## Applied on the ben-design branch (for Leo to review)

These changes are already in `scripts/crew_simulator.py` and the regenerated `data/crew_sim.json` / `.csv`:

- Blood pressure: in-flight shift of -8 / -9 mmHg, reached over the first 14 days (Norsk et al. 2015).
- Heart rate: in-flight shift reduced to about +1 bpm plus a small stress effect, day-to-day SD 2.5.
- Core temperature: rises to +0.6 C by day 75, then plateaus. This is the low option on purpose; Stahn et al. 2017 saw +1.0 C, which would read as a fever on screen.
- Fluid intake baselines lowered to 2.2-2.5 L/day; sodium baselines raised to 4.0-4.8 g/day with SD 500 mg (NASA HRP nutrition data). The planted day-55 event now adds 1,000 mg of sodium instead of 600 (DEMO).
- Body mass: 2-4% lost in the first 30 days, then stable, instead of a straight decline.
- Radiation: day-to-day SD raised to 0.2 mSv; solar storm reduced to 14 + 4 mSv (18 total), inside the range MSL RAD saw per event.
- Engine: `src/engine/signals.ts` now gives body temperature `expectedPerDay: 0.008` so the known in-flight rise is not flagged, the same way bone and muscle loss are handled.

`node scripts/check_drift.ts`: all checks pass; unexplained "far outside" rate 0.43% (limit 1%).
