import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import type { BodySystem, BodySystemId, SystemStatus } from "../ui/viewTypes.ts";
import { SYSTEM_BY_ID, type Layer } from "../ui/systems.ts";
import skeletonUrl from "../assets/anatomy/skeleton.svg";
import musclesUrl from "../assets/anatomy/muscles.png";
import musclesMaskUrl from "../assets/anatomy/muscles-loss-mask.png";
import bonesMaskUrl from "../assets/anatomy/bones-load-mask.png";
import lungsUrl from "../assets/anatomy/organs/lungs.png";
import heartUrl from "../assets/anatomy/organs/heart.png";
import liverUrl from "../assets/anatomy/organs/liver.png";
import stomachUrl from "../assets/anatomy/organs/stomach.png";
import intestineUrl from "../assets/anatomy/organs/intestine.png";
import urinaryUrl from "../assets/anatomy/organs/urinary.png";
import card from "./Card.module.css";
import { Segmented } from "./Segmented";
import { More } from "./More";
import s from "./BodyMap.module.css";

// Detailed front-view body map in three layers, in natural textbook colours:
// - Skeleton: public-domain illustration (M. Ruiz Villarreal and M. Häggström, Wikimedia Commons)
// - Muscles: OpenStax Anatomy and Physiology, CC BY 4.0, resized
// - Organs: CC0 organ illustrations by M. Häggström (Wikimedia Commons), placed on a faded copy of the skeleton
// Amber highlights on the skeleton and muscles are masks cut from the illustrations, so they follow
// the exact bone and muscle outlines.
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
  organs: "Organs: M. Häggström, CC0. Skeleton: M. Ruiz Villarreal and M. Häggström, public domain. Wikimedia Commons.",
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
  const amber = `amber${uid}`, ink = `ink${uid}`, ring = `ring${uid}`;
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

  // Exact-shape masks get the amber ring only when their system is flagged
  const maskFilter = (id: BodySystemId) => (by[id].status === "watch" || by[id].status === "act" ? { filter: `url(#${ring})` } : undefined);

  const figure = (
    <svg viewBox={VB} className={s.figure} aria-label="Body map">
      <defs>
        {/* Outline filters: a thick ring around a flagged (amber) or selected (ink) part */}
        {/* thick glow for drawn organs, thin ring for the exact-shape bone and muscle masks */}
        {([[amber, "#E08A1E", 4, 3], [ink, "#10131A", 3, 0.5], [ring, "#C27C00", 1.2, 0.4]] as const).map(([id, col, grow, blur]) => (
          <filter key={id} id={id} x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={grow} result="grown" />
            <feFlood floodColor={col} />
            <feComposite in2="grown" operator="in" result="ring" />
            <feGaussianBlur in="ring" stdDeviation={blur} result="soft" />
            <feMerge><feMergeNode in="soft" /><feMergeNode in="ring" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>

      {layer === "organs" && (
        <>
          <image href={skeletonUrl} {...SKELETON} opacity={0.28} className={s.blend} />
          {region("lungs", <image href={lungsUrl} x="137" y="150" width="130" height="136" />, s.organ)}
          {region("heart", <image href={heartUrl} x="193" y="190" width="40" height="75" />, s.organ)}
          {region("gut", <>
            <image href={liverUrl} x="140" y="256" width="96" height="65" />
            <image href={stomachUrl} x="204" y="262" width="52" height="48" />
            <image href={intestineUrl} x="160" y="318" width="86" height="80" />
          </>, s.organ)}
          {region("kidneys", <image href={urinaryUrl} x="160" y="288" width="85" height="128" />, s.organ)}
          {region("mind", <>
            <path d="M201 26 C186 25 173 34 172 48 C171 62 180 72 194 73 C198 73 200 71 201 69 Z M203 26 C218 25 231 34 232 48 C233 62 224 72 210 73 C206 73 204 71 203 69 Z" fill="#E7C3C6" stroke="#B98D93" strokeWidth="1.2" />
            <path d="M178 42 C184 38 188 44 194 40 M176 54 C183 50 189 57 196 52 M181 64 C187 60 192 66 197 62 M226 42 C220 38 216 44 210 40 M228 54 C221 50 215 57 208 52 M223 64 C217 60 212 66 207 62" fill="none" stroke="#B98D93" strokeWidth="1" />
          </>, s.organ)}
          {region("eyes", <><ellipse className={s.orbit} cx="183" cy="72" rx="8" ry="7" /><ellipse className={s.orbit} cx="221" cy="72" rx="8" ry="7" /></>)}
        </>
      )}

      {layer === "skeleton" && region("bones", <>
        <image href={skeletonUrl} {...SKELETON} className={s.blend} />
        <rect x="120" y="15" width="165" height="790" fill="transparent" />
        {/* spine, pelvis and thigh bones, cut from the illustration: where space bone loss is greatest */}
        <image href={bonesMaskUrl} {...SKELETON} className={s.mask} style={maskFilter("bones")} />
      </>)}

      {layer === "muscles" && region("muscles", <>
        <image href={musclesUrl} {...MUSCLES} className={s.blend} />
        <rect x="100" y="15" width="205" height="790" fill="transparent" />
        {/* thigh and calf muscles, cut from the illustration: where space muscle loss is greatest */}
        <image href={musclesMaskUrl} {...MUSCLES} className={s.mask} style={maskFilter("muscles")} />
      </>)}
    </svg>
  );

  const rows = (items: BodySystem[]) => (
    <ul className={s.list}>
      {items.map((x) => (
        <li key={x.id}>
          <button className={`${s.row} ${statusClass[x.status]} ${selected === x.id ? s.rowSelected : ""}`} onClick={() => onSelect(x.id)}>
            {x.label}<span>{statusText[x.status]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
  // Overview: only what is outside normal, from every layer; the rest folds away. Health: the current layer, in full.
  const flagged = systems.filter((x) => x.status === "watch" || x.status === "act");
  const list = size === "full" ? (
    <div className={s.side}>
      {rows(inLayer)}
      {LAYER_HINT[layer] && <p className={s.hint}>{LAYER_HINT[layer]}</p>}
    </div>
  ) : (
    <div className={s.side}>
      {flagged.length ? rows(flagged) : <p className={s.hint}>Everything is inside your normal.</p>}
      <More label={`All ${systems.length} systems`}>{rows(systems.filter((x) => !flagged.includes(x)))}</More>
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
      {size === "full" && <More label="Image credits"><p className={s.credit}>{CREDIT[layer]}</p></More>}
    </section>
  );
}
