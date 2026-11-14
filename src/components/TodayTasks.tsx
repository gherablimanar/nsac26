import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import type { Task } from "../ui/viewTypes.ts";
import card from "./Card.module.css";
import s from "./TodayTasks.module.css";

export function TodayTasks({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState(initial);
  const done = tasks.filter((t) => t.done).length;
  const toggle = (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  return (
    <section className={card.card} aria-labelledby="today-title">
      <div className={card.head}><h2 id="today-title">Today</h2><span>{done} of {tasks.length} done</span></div>
      <ul className={s.list}>
        {tasks.map((t) => (
          <li key={t.id}>
            <label className={`${s.task} ${t.done ? s.done : ""}`}>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span className={s.box} aria-hidden="true">{t.done && <Check size={14} weight="bold" />}</span>
              <span className={s.text}>{t.label}{t.when && <small>{t.when}</small>}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
