import type { KeyboardEvent } from "react";
import type { BodySystem, BodySystemId, SystemStatus } from "../ui/viewTypes.ts";
import card from "./Card.module.css";
import s from "./BodyMap.module.css";

// Clickable body figure. Colours come only from the status data; every region also has a
// text label in the list beside it (the list is the accessible alternative).

const HALF = "M60 40 C64 40 66 42 66.5 47 L67 52 C74 55 84 56 90 59 C96 62 98 68 99 76 L101 112 L103 150 C103.5 156 103 160 101 166 C100 171 96 172 95 168 L93 152 L90 116 L87 86 L85 84 L83 112 L80 130 C83 138 85 146 84 156 L82 204 L79 246 C80 250 83 252 82 256 L67 256 C65 252 66 248 66 244 L64 204 L62 166 L60 160 Z";
const KIDNEY_L = "M50 104 c-5 0 -7 5 -7 10 s2 11 7 11 c3 0 4 -3 3 -6 c-1 -2 -1 -4 0 -6 c1 -3 0 -9 -3 -9z";
const KIDNEY_R = "M70 104 c5 0 7 5 7 10 s-2 11 -7 11 c-3 0 -4 -3 -3 -6 c1 -2 1 -4 0 -6 c-1 -3 0 -9 3 -9z";

const statusClass: Record<SystemStatus, string> = { normal: s.normal, watch: s.watch, act: s.act, unknown: s.unknown };
const statusText: Record<SystemStatus, string> = { normal: "Normal", watch: "Watch", act: "Act", unknown: "No reading yet" };

export function BodyMap({ systems, onSelect }: { systems: BodySystem[]; onSelect: (id: BodySystemId) => void }) {
  const by = Object.fromEntries(systems.map((x) => [x.id, x])) as Record<BodySystemId, BodySystem>;
  const region = (id: BodySystemId) => ({
    role: "button",
    tabIndex: 0,
    "aria-label": `${by[id].label}: ${statusText[by[id].status]}`,
    className: `${s.region} ${statusClass[by[id].status]}`,
    onClick: () => onSelect(id),
    onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); } },
  });

  return (
    <section className={card.card} aria-labelledby="body-title">
      <div className={card.head}><h2 id="body-title">Body</h2><button onClick={() => onSelect("kidneys")}>Open Health</button></div>
      <div className={s.layout}>
        <svg viewBox="0 0 120 262" className={s.figure}>
          <g {...region("musculo")} data-part="body">
            <path d={HALF} />
            <path d={HALF} transform="translate(120 0) scale(-1 1)" />
          </g>
          <circle {...region("mind")} cx="60" cy="22" r="16" />
          <g {...region("eyes")} data-part="organ"><circle cx="54" cy="21" r="2.6" /><circle cx="66" cy="21" r="2.6" /></g>
          <ellipse {...region("heart")} data-part="organ" cx="66" cy="78" rx="6" ry="7" />
          <g {...region("kidneys")} data-part="organ"><path d={KIDNEY_L} /><path d={KIDNEY_R} /></g>
        </svg>
        <ul className={s.list}>
          {systems.map((x) => (
            <li key={x.id}>
              <button className={`${s.row} ${statusClass[x.status]}`} onClick={() => onSelect(x.id)}>
                {x.label}<span>{statusText[x.status]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
