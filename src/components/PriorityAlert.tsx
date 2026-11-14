import { useEffect, useRef, useState } from "react";
import { Check, PaperPlaneTilt } from "@phosphor-icons/react";
import type { LinkedSeries, PriorityRisk, Task } from "../ui/viewTypes.ts";
import { LinkedSignalsChart } from "./LinkedSignalsChart";
import { PageField } from "./PageField";
import { LiquidGlassButton } from "./ui/apple-tahoe-liquid-glass-button";
import s from "./PriorityAlert.module.css";

type Props = { risk: PriorityRisk | null; series: LinkedSeries[]; today: number; delay: string | null; nextTask?: Task; flagged: string[] };

/** The one loud thing on the Overview: what is linked, what it shows, what to do. */
export function PriorityAlert({ risk, series, today, delay, nextTask, flagged }: Props) {
  const [done, setDone] = useState<string[]>([]);
  const [why, setWhy] = useState(false);
  const hero = useRef<HTMLElement>(null);
  useEffect(() => setDone([]), [risk]);
  if (!risk) {
    const one = flagged.length === 1;
    return (
      <section ref={hero} className={s.hero} aria-labelledby="risk-title">
        <PageField state="normal" edge={hero} />
        <p className={s.status}>{flagged.length ? "No linked risks" : "All normal"}</p>
        <h1 id="risk-title" className={s.title}>Nothing needs you today</h1>
        <p className={s.why}>
          {flagged.length
            ? `${flagged.join(" and ")} ${one ? "is" : "are"} outside your normal range, but nothing is linked to ${one ? "it" : "them"}. HALO keeps watching.`
            : "Every reading is inside your own normal range, and no linked risks are rising."}
        </p>
        {nextTask && <p className={s.next}>Next on your list: <b>{nextTask.label}</b>{nextTask.when ? `, ${nextTask.when.toLowerCase()}` : ""}</p>}
      </section>
    );
  }
  return (
    <section ref={hero} className={s.hero} aria-labelledby="risk-title">
      <PageField state={risk.level} edge={hero} />
      <p className={s.status}><b className={risk.level === "act" ? s.actWord : ""}>{risk.level === "act" ? "Act" : "Watch"}</b>&nbsp;&nbsp;since Day {risk.sinceDay}</p>
      <h1 id="risk-title" className={s.title}>{risk.level === "act" ? <mark className={s.alarm}>{risk.actTitle ?? risk.title}</mark> : risk.title}</h1>
      <p className={s.why}>{risk.short}</p>
      <div className={s.chart}>
        <LinkedSignalsChart series={series} eventDay={risk.eventDay} eventLabel={risk.eventLabel} today={today} />
      </div>
      {/* A real to-do: tick steps off; the big button is always the next step */}
      <div className={s.plan}>
        <div className={s.planHead}><h2>Today's plan</h2><span><span className={`mono ${done.length ? s.count : ""}`}>{done.length}</span> of {risk.plan.length} done</span></div>
        <ol className={s.steps}>
          {risk.plan.map((p) => {
            const isDone = done.includes(p.id);
            return (
              <li key={p.id}>
                <label className={`${s.step} ${isDone ? s.stepDone : ""}`}>
                  <input type="checkbox" checked={isDone} onChange={() => setDone((d) => (isDone ? d.filter((x) => x !== p.id) : [...d, p.id]))} />
                  <span className={s.box} aria-hidden="true">{isDone && <Check size={14} weight="bold" />}</span>
                  <span>{p.label}<small>{p.when}</small></span>
                </label>
              </li>
            );
          })}
        </ol>
      </div>
      <div className={s.act}>
        {(() => {
          const next = risk.plan.find((p) => !done.includes(p.id));
          return next
            ? <button className={s.cta} onClick={() => setDone((d) => [...d, next.id])}><Check size={18} weight="bold" /><span key={next.id} className={s.ctaLabel}>{next.cta}</span></button>
            : <span className={s.allDone}><Check size={18} weight="bold" />Today's plan is done. HALO checks again tomorrow.</span>;
        })()}
        <LiquidGlassButton asChild interactive material="clear">
          <button type="button" className={s.glassBtn} aria-expanded={why} aria-controls="why-more" onClick={() => setWhy(!why)}>Why these are linked</button>
        </LiquidGlassButton>
      </div>
      {why && (
        <div id="why-more" className={s.whyMore}>
          <p>{risk.why}</p>
          {delay && <p className={s.queued}><PaperPlaneTilt size={16} />HALO queued a note for your flight surgeon. It reaches Houston in <span className="mono">{delay}</span></p>}
        </div>
      )}
    </section>
  );
}
