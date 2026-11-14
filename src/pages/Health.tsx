import { useMemo } from "react";
import { BookOpen } from "@phosphor-icons/react";
import { BodyMap } from "../components/BodyMap";
import { SignalTrend } from "../components/SignalTrend";
import { SYSTEMS, SYSTEM_BY_ID, driftOn, systemStatus } from "../ui/systems.ts";
import type { BodySystem, BodySystemId } from "../ui/viewTypes.ts";
import card from "../components/Card.module.css";
import s from "./Health.module.css";

type Props = { crewId: string; day: number; selected: BodySystemId | null; onSelect: (id: BodySystemId) => void };

const STATUS_TEXT = { normal: "Normal", watch: "Watch", act: "Act", unknown: "No reading yet" } as const;

/** Each body system in detail: the map on the left, the selected system's signals on the right. */
export function Health({ crewId, day, selected, onSelect }: Props) {
  const systems: BodySystem[] = useMemo(() => {
    const drift = driftOn(crewId, day);
    return SYSTEMS.map((def) => {
      const status = systemStatus(def, drift);
      return { id: def.id, label: def.label, status, detail: STATUS_TEXT[status] };
    });
  }, [crewId, day]);

  const sel: BodySystemId = selected ?? systems.find((x) => x.status === "watch")?.id ?? "heart";
  const def = SYSTEM_BY_ID[sel];
  const status = systems.find((x) => x.id === sel)!.status;

  return (
    <>
      <h1 className={s.title}>Health</h1>
      <p className={s.sub}>Every reading compared with your own normal, not an Earth average.</p>
      <div className={s.grid}>
        <div className={s.map}>
          <BodyMap size="full" systems={systems} selected={sel} onSelect={onSelect} />
        </div>
        <div className={s.panel}>
          <header className={s.head}>
            <div className={s.nameRow}>
              <h2 className={s.name}>{def.label}</h2>
              <span className={`${s.status} ${status === "watch" ? s.watch : ""}`}>{STATUS_TEXT[status]}</span>
            </div>
            <p className={s.hazards}>Hazards: {def.hazards.join(", ")}</p>
            <h3 className={s.whyTitle}>Why this matters in space</h3>
            <p className={s.why}>{def.why}</p>
            <p className={s.source}><BookOpen size={16} aria-hidden />{def.source}</p>
          </header>
          {def.signals.length === 0 ? (
            <div className={card.card}>
              <p className={s.emptyTitle}>No eye readings yet.</p>
              <p className={s.emptyText}>The weekly vision self-test in Daily Log catches early signs of SANS.</p>
            </div>
          ) : (
            def.signals.map((k) => <SignalTrend key={`${crewId}-${k}`} crewId={crewId} day={day} signal={k} />)
          )}
        </div>
      </div>
    </>
  );
}
