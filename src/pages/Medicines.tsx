import { useState } from "react";
import card from "../components/Card.module.css";
import { readingOn } from "../data/crew";
import { PACKED_DAYS_BEFORE_LAUNCH, POTENCY, SET_ON_DAY, TODAY, WEEK, WEEK_DAYS, strengthOf, below90Day } from "../ui/medicinesData";
import s from "./Medicines.module.css";

type Props = { crewId: string; day: number };

export function Medicines({ crewId, day }: Props) {
  const [melTaken, setMelTaken] = useState(false);
  const total = readingOn(crewId, day)?.radiation_mSv_total ?? 0;
  const stowed = day + PACKED_DAYS_BEFORE_LAUNCH;

  return (
    <>
      <h1 className={s.title}>Medicines</h1>
      <p className={s.sub}>Your schedule is set by your flight surgeon. HALO never changes doses.</p>

      <div className={s.grid}>
        <section className={`${card.card}`} aria-labelledby="today-h">
          <div className={card.head}><h2 id="today-h">Today</h2></div>
          <ul className={s.list}>
            {TODAY.map((m) => {
              const status = m.id === "mel" && melTaken ? "Taken" : m.status;
              return (
                <li key={m.id} className={s.row}>
                  <span className={`mono ${s.time}`}>{m.time}</span>
                  <span className={s.what}><b>{m.name}</b><span>{m.how}</span></span>
                  <span className={status === "Due" ? s.due : s.state}>{status}</span>
                </li>
              );
            })}
          </ul>
          <div className={s.act}>
            {melTaken
              ? <button type="button" className={s.text} onClick={() => setMelTaken(false)}>Undo</button>
              : <button type="button" className={s.cta} onClick={() => setMelTaken(true)}>Mark melatonin as taken</button>}
          </div>
          <p className={s.note}>Set by your flight surgeon on Day {SET_ON_DAY}.</p>
        </section>

        <section className={card.card} aria-labelledby="week-h">
          <div className={card.head}><h2 id="week-h">Last 7 days</h2></div>
          <div className={s.weeks}>
            {WEEK.map((w) => {
              const doses = w.name === "Melatonin" && melTaken ? w.doses.map((d, i) => (i === 6 ? "taken" : d)) : w.doses;
              const n = doses.filter((d) => d === "taken").length;
              return (
                <div key={w.name}>
                  <div className={s.weekHead}><b>{w.name}</b><span>{n} of 7 taken</span></div>
                  <div className={s.squares}>
                    {doses.map((d, i) => (
                      <div key={i} className={s.cell}>
                        <span className={`${s.sq} ${s[d]}`} role="img" aria-label={`Day ${WEEK_DAYS[i]}, ${d === "pending" ? "not taken yet" : d}`} />
                        <span className={`mono ${s.dayLabel}`}>D{WEEK_DAYS[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`${card.card} ${s.pharm}`} aria-labelledby="ph-h">
          <div className={card.head}><h2 id="ph-h">Onboard pharmacy</h2></div>
          <p className={s.lead}>Estimated strength of each medicine after time and radiation in space.</p>
          <table className={s.table}>
            <thead>
              <tr><th>Medicine</th><th>Days stowed</th><th>Radiation absorbed</th><th>Estimated strength</th><th>Below 90% around</th><th>Note</th></tr>
            </thead>
            <tbody>
              {POTENCY.map((p) => {
                const st = strengthOf(p.k, p.r, stowed, total);
                const drop = below90Day(p.k, p.r, day, total);
                // No resupply on a Mars transit: flag anything dropping below 90% within about 6 months
                const note = st < 80 ? "Below 80%" : st < 90 || (drop !== null && drop - day < 180) ? "Use first" : "Fine";
                return (
                  <tr key={p.name}>
                    <th scope="row">{p.name}</th>
                    <td className="mono">{stowed}</td>
                    <td><span className="mono">{Math.round(total)}</span> mSv</td>
                    <td><span className="mono">{st}</span>%</td>
                    <td>{drop === null ? "Lasts the round trip" : <span className="mono">Day {drop}</span>}</td>
                    <td className={note === "Fine" ? s.fine : s.warn}>{note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className={s.note}>Demo model shaped by Du et al. 2011: after 880 days in orbit only 31% of medicines passed potency tests, against 54% on Earth. Not a lab measurement. Future dose assumes 1.8 mSv per day in Mars cruise.</p>
        </section>
      </div>
    </>
  );
}
