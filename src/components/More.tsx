import type { ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";
import s from "./More.module.css";

/** Detail people rarely need, folded away until asked for. Native <details> so keyboard and screen readers work. */
export function More({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className={s.more}>
      <summary>{label}<CaretDown size={14} weight="bold" className={s.caret} /></summary>
      <div className={s.body}>{children}</div>
    </details>
  );
}
