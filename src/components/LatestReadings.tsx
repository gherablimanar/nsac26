import type { ReadingSummary } from "../ui/viewTypes.ts";
import card from "./Card.module.css";
import s from "./LatestReadings.module.css";

export function LatestReadings({ readings, onAll }: { readings: ReadingSummary[]; onAll: () => void }) {
  return (
    <section className={`${card.card} ${s.wide}`} aria-labelledby="read-title">
      <div className={card.head}><h2 id="read-title">Latest readings</h2><button onClick={onAll}>All readings</button></div>
      <div className={s.grid}>
        {readings.map((r) => (
          <div key={r.label}>
            <div className={s.k}>{r.label}</div>
            <div className={`${s.v} ${r.out ? s.out : ""}`}>{r.value}{r.unit && <small>{r.unit}</small>}</div>
            <div className={`${s.n} ${r.out ? s.out : ""}`}>{r.out ? `Outside your normal. ${r.note}` : r.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
