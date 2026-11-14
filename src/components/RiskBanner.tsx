import { ArrowRight, WarningOctagon } from "@phosphor-icons/react";
import type { PriorityRisk } from "../ui/viewTypes.ts";
import s from "./RiskBanner.module.css";

/** While a risk is at Act, every page carries it: what it is, the next step, and a way back to the plan. */
export function RiskBanner({ risk, onOpen }: { risk: PriorityRisk; onOpen: () => void }) {
  const next = risk.plan[0];
  return (
    <div className={s.banner} role="status">
      <WarningOctagon size={22} weight="fill" aria-hidden="true" />
      <p><b>{risk.title.replace(/ is rising$/, "")}: Act.</b>{next && <> Next: {next.label.toLowerCase()}, {next.when.toLowerCase()}.</>}</p>
      <button type="button" onClick={onOpen}>See plan<ArrowRight size={16} weight="bold" /></button>
    </div>
  );
}
