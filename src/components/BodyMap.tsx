import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { BodySystem, BodySystemId, SystemStatus } from "../ui/viewTypes.ts";
import { SYSTEM_BY_ID, type Layer } from "../ui/systems.ts";
import card from "./Card.module.css";
import { Segmented } from "./Segmented";
import s from "./BodyMap.module.css";

// Front-view body map in three layers. Colour comes only from status data; every region has a
// text label in the list beside it (the accessible alternative). Proportions ~7.5 heads tall.

const HALF = "M80 54 L88 55 L89 64 C97 67 111 68 119 71 C127 74 131 80 131 90 C132 104 133 118 134 132 C135 146 137 162 138 176 C139 188 140 200 140 208 C143 213 145 222 142 231 C140 237 134 237 133 231 C132 224 131 216 131 209 C129 196 126 182 124 168 C122 154 120 140 118 128 C117 118 116 110 114 104 C113 126 110 148 108 166 C107 176 111 186 113 196 C114 210 112 236 110 256 C109 266 108 272 107 280 C109 296 109 314 104 334 C104 340 108 346 106 350 L88 350 C87 344 88 338 88 334 C86 316 85 298 86 282 C86 276 87 270 87 264 C86 246 84 226 82 212 L80 210 Z";
const MIRROR = "translate(160 0) scale(-1 1)";

const statusClass: Record<SystemStatus, string> = { normal: s.normal, watch: s.watch, act: s.act, unknown: s.unknown };
const statusText: Record<SystemStatus, string> = { normal: "Normal", watch: "Watch", act: "Act", unknown: "No reading yet" };

const LAYERS: { id: Layer; label: string }[] = [
  { id: "organs", label: "Organs" },
  { id: "skeleton", label: "Skeleton" },
  { id: "muscles", label: "Muscles" },
];
const LAYER_HINT: Partial<Record<Layer, string>> = {
  skeleton: "Hips, spine and legs lose the most bone without gravity.",
  muscles: "Calves and thighs lose the most muscle without gravity.",
};

type Props = {
  systems: BodySystem[];
  onSelect: (id: BodySystemId) => void;
  size?: "compact" | "full";
  selected?: BodySystemId;
  onOpen?: () => void;
};

export function BodyMap({ systems, onSelect, size = "compact", selected, onOpen }: Props) {
  const [layer, setLayer] = useState<Layer>("organs");
  const by = Object.fromEntries(systems.map((x) => [x.id, x])) as Record<BodySystemId, BodySystem>;
  const inLayer = systems.filter((x) => SYSTEM_BY_ID[x.id].layer === layer);

  const region = (id: BodySystemId, children: ReactNode, extra = "") => (
    <g role="button" tabIndex={0} aria-label={`${by[id].label}: ${statusText[by[id].status]}`}
      className={`${s.region} ${statusClass[by[id].status]} ${selected === id ? s.selected : ""} ${extra}`}
      onClick={() => onSelect(id)}
      onKeyDown={(e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); } }}>
      {children}
    </g>
  );

  const both = (el: ReactNode) => <>{el}<g transform={MIRROR}>{el}</g></>;

  const figure = (
    <svg viewBox="0 0 160 360" className={s.figure} aria-label="Body map">
      <g className={s.body}>
        <ellipse cx="80" cy="32" rx="16" ry="21" />
        <path d={HALF} /><path d={HALF} transform={MIRROR} />
      </g>

      {layer === "organs" && (
        <>
          {region("mind", <ellipse cx="80" cy="24" rx="12" ry="9" />, s.organ)}
          {region("eyes", <><circle cx="74" cy="36" r="2.4" /><circle cx="86" cy="36" r="2.4" /></>, s.organ)}
          {region("lungs", <>
            <path d="M75 84 C66 86 60 96 59 112 C58 126 60 136 64 140 C69 142 74 138 76 132 Z" />
            <path d="M85 88 C88 85 93 84 96 86 C101 90 102 104 102 116 C102 128 100 136 96 140 C92 141 88 138 87 134 Z" />
          </>, s.organ)}
          {region("heart", <ellipse cx="85" cy="116" rx="8.5" ry="11" transform="rotate(-25 85 116)" />, `${s.organ} ${s.heart}`)}
          {region("gut", <>
            <path d="M88 132 C95 130 100 135 99 142 C98 149 91 151 86 148 C83 145 83 135 88 132 Z" />
            <path d="M64 179 C64 172 71 170 79 172 C87 170 97 171 97 179 C99 187 98 196 92 200 C84 204 72 204 66 199 C62 195 62 186 64 179 Z" />
            <path d="M69 182 C74 178 78 186 83 182 C88 178 91 186 92 184 M69 192 C74 188 78 196 83 192 C88 188 91 196 92 194" className={s.gutLine} />
          </>, s.organ)}
          {region("kidneys", <>
            <path d="M66 152 c-5 0 -7 5 -7 10 s2 10 7 10 c3 0 4 -3 3 -5 c-1 -2 -1 -4 0 -6 c1 -3 0 -9 -3 -9z" />
            <path d="M94 152 c5 0 7 5 7 10 s-2 10 -7 10 c-3 0 -4 -3 -3 -5 c1 -2 1 -4 0 -6 c-1 -3 0 -9 3 -9z" />
          </>, s.organ)}
        </>
      )}

      {layer === "skeleton" && region("bones", <>
        <ellipse cx="80" cy="31" rx="14.5" ry="19" className={s.boneLine} />
        {Array.from({ length: 20 }, (_, i) => <rect key={i} x="77" y={58 + i * 7} width="6" height="5" rx="1.5" className={s.load} />)}
        {both(<path d="M80 70 C92 68 104 70 116 75" className={s.boneLine} />)}
        <rect x="78.5" y="78" width="3" height="38" rx="1.5" className={s.boneFill} />
        {both(<>{[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M82 ${84 + i * 8} C94 ${82 + i * 8} 104 ${86 + i * 8} 107 ${96 + i * 8}`} className={s.boneLine} />)}</>)}
        {both(<path d="M80 188 C72 184 60 186 58 196 C57 204 64 210 72 210 C76 208 78 206 80 206 Z" className={s.load} />)}
        {both(<>
          <line x1="96" y1="208" x2="98" y2="274" className={`${s.long} ${s.loadStroke}`} />
          <circle cx="98" cy="279" r="3" className={s.boneFill} />
          <line x1="98" y1="285" x2="97" y2="334" className={`${s.long} ${s.loadStroke}`} />
          <line x1="122" y1="80" x2="128" y2="160" className={s.long} />
          <line x1="128" y1="166" x2="134" y2="206" className={s.thin} />
        </>)}
      </>)}

      {layer === "muscles" && region("muscles", <>
        {both(<>
          <path d="M80 80 C92 77 110 80 114 92 C110 104 92 106 80 102 Z" className={s.muscle} />
          <ellipse cx="124" cy="88" rx="8" ry="12" transform="rotate(-15 124 88)" className={s.muscle} />
          <ellipse cx="126" cy="120" rx="5.5" ry="15" transform="rotate(-8 126 120)" className={s.muscle} />
          <ellipse cx="133" cy="182" rx="4.5" ry="17" transform="rotate(-6 133 182)" className={s.muscle} />
          <ellipse cx="99" cy="236" rx="10" ry="30" transform="rotate(4 99 236)" className={s.loss} />
          <ellipse cx="100" cy="306" rx="6.5" ry="22" transform="rotate(-3 100 306)" className={s.loss} />
        </>)}
        {[0, 1, 2].map((i) => <g key={i}><rect x="70" y={110 + i * 18} width="9" height="15" rx="4" className={s.muscle} /><rect x="81" y={110 + i * 18} width="9" height="15" rx="4" className={s.muscle} /></g>)}
      </>)}
    </svg>
  );

  const list = (
    <div className={s.side}>
      <ul className={s.list}>
        {inLayer.map((x) => (
          <li key={x.id}>
            <button className={`${s.row} ${statusClass[x.status]} ${selected === x.id ? s.rowSelected : ""}`} onClick={() => onSelect(x.id)}>
              {x.label}<span>{statusText[x.status]}</span>
            </button>
          </li>
        ))}
      </ul>
      {LAYER_HINT[layer] && <p className={s.hint}>{LAYER_HINT[layer]}</p>}
    </div>
  );

  return (
    <section className={`${card.card} ${size === "full" ? s.full : ""}`} aria-labelledby="body-title">
      <div className={card.head}>
        <h2 id="body-title">Body</h2>
        {onOpen && <button onClick={onOpen}>Open Health</button>}
      </div>
      <Segmented label="Body layer" options={LAYERS} value={layer} onChange={setLayer} />
      <div className={s.layout}>{figure}{list}</div>
    </section>
  );
}
