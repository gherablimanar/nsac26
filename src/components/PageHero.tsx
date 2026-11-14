import { useRef, type ReactNode } from "react";
import type { RiskLevel } from "../ui/viewTypes.ts";
import { PageField } from "./PageField";
import s from "./PageHero.module.css";

type Props = { page: string; state: RiskLevel; title: ReactNode; line?: ReactNode; aside?: ReactNode; children?: ReactNode };

/** A page's one loud thing: what matters on this page right now, on the colour field. Same voice as the Overview hero. */
export function PageHero({ page, state, title, line, aside, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  return (
    <header ref={ref} className={s.hero}>
      <PageField state={state} edge={ref} />
      <div className={s.top}>
        <p className={s.eyebrow}>
          {page}{state !== "normal" && <>&nbsp;&nbsp;<b className={state === "act" ? s.act : s.watch}>{state === "act" ? "Act" : "Watch"}</b></>}
        </p>
        {aside}
      </div>
      <h1 className={s.title}>{title}</h1>
      {line && <p className={s.line}>{line}</p>}
      {children && <div className={s.actions}>{children}</div>}
    </header>
  );
}
