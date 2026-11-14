import { ArrowRight, PaperPlaneTilt } from "@phosphor-icons/react";
import type { LinkedSeries, PriorityRisk, Task } from "../ui/viewTypes.ts";
import { LinkedSignalsChart } from "./LinkedSignalsChart";
import { LiquidGlassButton } from "./ui/apple-tahoe-liquid-glass-button";
import s from "./PriorityAlert.module.css";

type Props = {
  onReview?: () => void;
  risk: PriorityRisk | null;
  series: LinkedSeries[];
  today: number;
  delay: string | null;
  nextTask?: Task;
  flagged: string[];
};

/** The one loud thing on the Overview: what is linked, what it shows, what to do. */
export function PriorityAlert({
  risk,
  series,
  today,
  delay,
  nextTask,
  flagged,
  onReview,
}: Props) {
  if (!risk) {
    const one = flagged.length === 1;
    return (
      <section className={s.hero} aria-labelledby="risk-title">
        <p className={s.status}>
          {flagged.length ? "No linked risks" : "No active demo pattern"}
        </p>
        <h1 id="risk-title" className={s.title}>
          Review your daily observations
        </h1>
        <p className={s.why}>
          {flagged.length
            ? `${flagged.join(" and ")} ${one ? "is" : "are"} outside your normal range, but nothing is linked to ${one ? "it" : "them"}. HALO keeps watching.`
            : "No persistent linked pattern was established. Unknown inputs and symptoms still need review."}
        </p>
        {nextTask && (
          <p className={s.next}>
            Next on your list: <b>{nextTask.label}</b>
            {nextTask.when ? `, ${nextTask.when.toLowerCase()}` : ""}
          </p>
        )}
      </section>
    );
  }
  return (
    <section className={s.hero} aria-labelledby="risk-title">
      <p className={s.status}>
        <b>{risk.level === "act" ? "Act" : "Watch"}</b>&nbsp;&nbsp;since Day{" "}
        {risk.sinceDay}
      </p>
      <h1 id="risk-title" className={s.title}>
        {risk.title}
      </h1>
      <p className={s.why}>{risk.why}</p>
      <div className={s.chart}>
        <LinkedSignalsChart
          series={series}
          eventDay={risk.eventDay}
          eventLabel={risk.eventLabel}
          today={today}
        />
      </div>
      <div className={s.act}>
        <button className={s.cta} onClick={onReview}>
          {risk.action}
          <ArrowRight size={18} />
        </button>
        <LiquidGlassButton asChild interactive material="clear">
          <a
            className={s.glassBtn}
            href="#evidence"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("halo-navigate", { detail: "evidence" }),
              )
            }
          >
            Why these are linked
          </a>
        </LiquidGlassButton>
        {delay && (
          <span className={s.queued}>
            <PaperPlaneTilt size={16} />
            Scenario one-way delay: <span className="mono">{delay}</span>
          </span>
        )}
      </div>
    </section>
  );
}
