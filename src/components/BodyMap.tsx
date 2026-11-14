import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import type { BodySystem, BodySystemId, SystemStatus } from "../ui/viewTypes.ts";
import { SYSTEM_BY_ID, type Layer } from "../ui/systems.ts";
import skeletonUrl from "../assets/anatomy/skeleton.svg";
import musclesUrl from "../assets/anatomy/muscles.png";
import card from "./Card.module.css";
import { Segmented } from "./Segmented";
import s from "./BodyMap.module.css";

// Detailed front-view body map in three layers, in natural textbook colours:
// - Skeleton: public-domain illustration (M. Ruiz Villarreal and M. Häggström, Wikimedia Commons)
// - Muscles: OpenStax Anatomy and Physiology, CC BY 4.0, resized
// - Organs: drawn for HALO on a faded copy of the skeleton, so they sit anatomically right
// A system that needs attention gets an amber outline; the list beside it is the text version.
// All layers share one frame (viewBox) so the body stays in place when switching.

const VB = "-20 0 476 842";
const SKELETON = { x: 0, y: 0, width: 435.687, height: 841.89 };
const MUSCLES = { x: -43, y: 3.7, width: 482.7, height: 816.8 }; // scaled so head and feet match the skeleton

const statusClass: Record<SystemStatus, string> = { normal: s.normal, watch: s.watch, act: s.act, unknown: s.unknown };
const statusText: Record<SystemStatus, string> = { normal: "Normal", watch: "Watch", act: "Act", unknown: "No reading yet" };

const LAYERS: { id: Layer; label: string }[] = [
  { id: "organs", label: "Organs" },
  { id: "skeleton", label: "Skeleton" },
  { id: "muscles", label: "Muscles" },
];
const LAYER_HINT: Partial<Record<Layer, string>> = {
  skeleton: "Hips, spine and thigh bones lose the most density without gravity.",
  muscles: "Thighs and calves lose the most muscle without gravity.",
};
const CREDIT: Record<Layer, ReactNode> = {
  organs: "Organs drawn for HALO on a public-domain skeleton by M. Ruiz Villarreal and M. Häggström.",
  skeleton: "Skeleton: M. Ruiz Villarreal and M. Häggström, public domain, Wikimedia Commons.",
  muscles: <>Muscles: OpenStax Anatomy and Physiology, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, resized.</>,
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
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const amber = `amber${uid}`, ink = `ink${uid}`;
  const by = Object.fromEntries(systems.map((x) => [x.id, x])) as Record<BodySystemId, BodySystem>;
  const inLayer = systems.filter((x) => SYSTEM_BY_ID[x.id].layer === layer);

  const region = (id: BodySystemId, children: ReactNode, extra = "") => {
    const st = by[id].status;
    // Outline filter only for drawn organs (on the illustrations it would trace the image box);
    // illustration layers show status through their hot spots instead. A warning beats the selection.
    const outline = extra.includes(s.organ);
    const filter = !outline ? undefined : st === "watch" || st === "act" ? `url(#${amber})` : selected === id ? `url(#${ink})` : undefined;
    return (
      <g role="button" tabIndex={0} aria-label={`${by[id].label}: ${statusText[st]}`}
        className={`${s.region} ${statusClass[st]} ${extra}`} style={filter ? { filter } : undefined}
        onClick={() => onSelect(id)}
        onKeyDown={(e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); } }}>
        {children}
      </g>
    );
  };

  const figure = (
    <svg viewBox={VB} className={s.figure} aria-label="Body map">
      <defs>
        {/* Outline filters: a thick ring around a flagged (amber) or selected (ink) part */}
        {([[amber, "#E08A1E"], [ink, "#10131A"]] as const).map(([id, col]) => (
          <filter key={id} id={id} x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={id === amber ? 4 : 3} result="grown" />
            <feFlood floodColor={col} />
            <feComposite in2="grown" operator="in" result="ring" />
            <feGaussianBlur in="ring" stdDeviation={id === amber ? 3 : 0.5} result="soft" />
            <feMerge><feMergeNode in="soft" /><feMergeNode in="ring" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>

      {layer === "organs" && (
        <>
          <image href={skeletonUrl} {...SKELETON} opacity={0.28} className={s.blend} />
          {region("lungs", <>
            <path d="M192 166 C170 160 150 178 145 214 C140 250 145 279 159 288 C174 293 190 283 194 268 Z" fill="#E59AA4" stroke="#C26F7B" />
            <path d="M212 170 C231 162 252 177 258 211 C263 247 260 279 248 288 C236 294 223 286 219 277 C230 263 229 246 214 239 Z" fill="#E59AA4" stroke="#C26F7B" />
            <path d="M150 232 C164 226 180 236 192 230 M222 226 C234 232 246 226 256 232" fill="none" stroke="#C26F7B" strokeWidth="1.4" />
            <path d="M193 140 L193 170 M211 140 L211 172" stroke="#D9B8B8" strokeWidth="6" strokeLinecap="round" />
          </>, s.organ)}
          {region("heart", <>
            <path d="M198 212 C186 217 185 238 194 251 C203 263 219 268 230 261 C242 253 245 231 236 218 C228 206 211 204 198 212 Z" fill="#B3322A" stroke="#7F1F19" />
            <path d="M205 214 C214 210 224 212 230 220 C224 222 214 220 205 214 Z" fill="#D65A4E" />
            <path d="M206 210 C206 196 214 188 226 190" fill="none" stroke="#B3322A" strokeWidth="7" strokeLinecap="round" />
          </>, s.organ)}
          {region("gut", <>
            <path d="M141 262 C160 251 204 253 221 262 C219 279 199 293 175 299 C157 303 143 291 141 262 Z" fill="#8C3A2E" stroke="#5F241B" />
            <path d="M214 266 C232 257 255 265 257 284 C259 303 241 313 226 307 C217 303 222 291 211 286 Z" fill="#E3A47B" stroke="#B57650" />
            <path d="M158 322 C158 314 168 312 180 314 L226 314 C240 312 249 316 249 326 L249 372 C249 382 240 386 228 384 L178 384 C166 386 158 382 158 372 Z" fill="#E8B59C" stroke="#BF8669" />
            <path d="M172 334 C182 326 190 342 200 334 C210 326 218 342 230 334 M172 352 C182 344 190 360 200 352 C210 344 218 360 230 352 M176 370 C186 362 194 376 204 368 C214 360 222 376 230 370" fill="none" stroke="#BF8669" strokeWidth="1.6" />
          </>, s.organ)}
          {region("kidneys", <>
            <path d="M171 296 C160 296 154 306 155 318 C156 331 163 340 173 338 C179 337 181 331 178 326 C175 321 175 315 178 310 C181 304 179 296 171 296 Z" fill="#A24A2C" stroke="#6E2F1A" />
            <path d="M233 298 C244 298 250 308 249 320 C248 333 241 342 231 340 C225 339 223 333 226 328 C229 323 229 317 226 312 C223 306 225 298 233 298 Z" fill="#A24A2C" stroke="#6E2F1A" />
            <ellipse cx="202" cy="393" rx="13" ry="10" fill="#E5BE66" stroke="#B48C3A" />
          </>, s.organ)}
          {region("mind", <>
            <ellipse cx="202" cy="50" rx="31" ry="26" fill="#E6B6BD" stroke="#B9838C" />
            <path d="M202 25 L202 75 M180 44 C186 36 194 40 198 34 M206 34 C212 40 220 36 226 44 M178 57 C186 52 192 60 199 54 M205 54 C212 60 218 52 226 58" fill="none" stroke="#B9838C" strokeWidth="1.4" />
          </>, s.organ)}
          {region("eyes", <>
            <circle cx="183" cy="72" r="7" fill="#FBFBF8" stroke="#8C95A6" />
            <circle cx="221" cy="72" r="7" fill="#FBFBF8" stroke="#8C95A6" />
            <circle cx="183" cy="72" r="3.2" fill="#5C7F9A" /><circle cx="221" cy="72" r="3.2" fill="#5C7F9A" />
          </>, s.organ)}
        </>
      )}

      {layer === "skeleton" && region("bones", <>
        <image href={skeletonUrl} {...SKELETON} className={s.blend} />
        <rect x="120" y="15" width="165" height="790" fill="transparent" />
        {/* weight-bearing bones, where space bone loss is greatest */}
        <rect className={s.hot} x="191" y="125" width="22" height="270" rx="10" />
        <ellipse className={s.hot} cx="202" cy="368" rx="72" ry="44" />
        <line className={s.hotLine} x1="152" y1="390" x2="172" y2="575" />
        <line className={s.hotLine} x1="252" y1="390" x2="230" y2="575" />
      </>)}

      {layer === "muscles" && region("muscles", <>
        <image href={musclesUrl} {...MUSCLES} className={s.blend} />
        <rect x="100" y="15" width="205" height="790" fill="transparent" />
        {/* thighs and calves, where space muscle loss is greatest */}
        <ellipse className={s.hot} cx="161" cy="469" rx="37" ry="90" />
        <ellipse className={s.hot} cx="243" cy="469" rx="37" ry="90" />
        <ellipse className={s.hot} cx="161" cy="641" rx="27" ry="65" />
        <ellipse className={s.hot} cx="239" cy="641" rx="27" ry="65" />
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
      <Segmented label="Body layer" value={layer} onChange={setLayer}
        options={LAYERS.map((l) => ({ ...l, attention: systems.some((x) => SYSTEM_BY_ID[x.id].layer === l.id && (x.status === "watch" || x.status === "act")) }))} />
      <div className={s.layout}>{figure}{list}</div>
      <p className={s.credit}>{CREDIT[layer]}</p>
    </section>
  );
}
