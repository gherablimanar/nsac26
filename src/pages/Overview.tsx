import { useMemo } from "react";
import { BodyMap } from "../components/BodyMap";
import { LatestReadings } from "../components/LatestReadings";
import { PriorityAlert } from "../components/PriorityAlert";
import { TodayTasks } from "../components/TodayTasks";
import type { BodySystemId, RiskLevel } from "../ui/viewTypes.ts";
import { buildOverview } from "../ui/overviewData.ts";
import s from "./Overview.module.css";

/** The soft colour field behind the hero. Its colour is the risk state: blue normal, amber watch, red act. */
export function Field({ state }: { state: RiskLevel }) {
  return <div className={s.field} data-state={state} aria-hidden="true" />;
}

type Props = { crewId: string; day: number; delay: string | null; onOpenHealth: (id: BodySystemId) => void };

export function Overview({ crewId, day, delay, onOpenHealth }: Props) {
  const m = useMemo(() => buildOverview(crewId, day), [crewId, day]);
  const next = m.tasks.find((t) => !t.done);
  return (
    <>
      <PriorityAlert risk={m.risk} series={m.series} today={day} delay={delay} nextTask={next}
        flagged={m.systems.filter((x) => x.status === "watch" || x.status === "act").map((x) => x.label)} />
      {m.risk && <p className={s.others}>Other linked risks: {m.risk.otherRisks.join(", ")}. All inside your normal range.</p>}
      <div className={s.below}>
        <TodayTasks key={crewId} initial={m.tasks} />
        <BodyMap systems={m.systems} onSelect={onOpenHealth} />
        <LatestReadings readings={m.readings} onAll={() => onOpenHealth("heart")} />
      </div>
    </>
  );
}

export const overviewState = (crewId: string, day: number): RiskLevel => buildOverview(crewId, day).risk?.level ?? "normal";
