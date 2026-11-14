import { ArrowRight, PaperPlaneTilt } from "@phosphor-icons/react";
import type { LinkedSeries, PriorityRisk, Task } from "../ui/viewTypes.ts";
import { LinkedSignalsChart } from "./LinkedSignalsChart";
import s from "./PriorityAlert.module.css";

type Props = { risk: PriorityRisk | null; series: LinkedSeries[]; today: number; delay: string | null; nextTask?: Task };

/** The one loud thing on the Overview: what is linked, what it shows, what to do. */
export function PriorityAlert({ risk, series, today, delay, nextTask }: Props) {
  if (!risk) {
    return (
      <section className={s.hero} aria-labelledby="risk-title">
        <p className={s.status}>All normal</p>
        <h1 id="risk-title" className={s.title}>Nothing needs you today</h1>
        <p className={s.why}>Every reading is inside your own normal range, and no linked risks are rising.</p>
        {nextTask && <p className={s.next}>Next on your list: <b>{nextTask.label}</b>{nextTask.when ? `, ${nextTask.when.toLowerCase()}` : ""}</p>}
      </section>
    );
  }
  return (
    <section className={s.hero} aria-labelledby="risk-title">
      <p className={s.status}><b>{risk.level === "act" ? "Act" : "Watch"}</b>&nbsp;&nbsp;since Day {risk.sinceDay}</p>
      <h1 id="risk-title" className={s.title}>{risk.title}</h1>
      <p className={s.why}>{risk.why}</p>
      <div className={s.chart}>
        <LinkedSignalsChart series={series} eventDay={risk.eventDay} eventLabel={risk.eventLabel} today={today} />
      </div>
      <div className={s.act}>
        <button className={s.cta}>{risk.action}<ArrowRight size={18} /></button>
        <a className={s.link} href="#evidence">Why these are linked</a>
        {delay && <span className={s.queued}><PaperPlaneTilt size={16} />Note for your flight surgeon reaches Houston in <span className="mono">{delay}</span></span>}
      </div>
    </section>
  );
}
