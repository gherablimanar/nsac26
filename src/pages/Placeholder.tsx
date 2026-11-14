import card from "../components/Card.module.css";
import s from "./Settings.module.css";

/** Stand-in for screens that aren't designed yet, so navigation works end to end. */
export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <>
      <h1 className={s.title}>{title}</h1>
      <section className={`${card.card} ${s.group}`}><p style={{ margin: 0, color: "var(--ink-2)" }}>{note}</p></section>
    </>
  );
}
