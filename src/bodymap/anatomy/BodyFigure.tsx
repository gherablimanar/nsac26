import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { BodyMapModel, RegionStatus } from "../model.ts";
import type { RegionId, View } from "../regions.ts";
import { ART_BY_VIEW, HALF, HEAD, MIRROR, RING_BACK, VIEWBOX } from "./geometry.tsx";
import s from "./BodyFigure.module.css";

// Keyboard order: head to feet, then the systemic regions.
const ORDER: RegionId[] = ["brain", "eyes", "vessels", "lungs", "heart", "gut", "kidneys", "skeleton", "muscles", "skin_immune", "whole_body"];

const VIEW_NAME: Record<View, string> = { anterior: "Front view", posterior: "Back view" };

type Props = {
  view: View;
  model: BodyMapModel;
  selected: RegionId | null;
  linked: Set<RegionId> | null; // regions of the highlighted coupled risk (null = no highlight)
  onSelect: (id: RegionId, el: SVGGElement) => void;
  hidden?: RegionId[]; // regions not drawn on the figure (still listed elsewhere)
};

/** Status badge: a shape per status, so colour is never the only cue. */
function Badge({ status, x, y }: { status: RegionStatus; x: number; y: number }) {
  if (status === "watch")
    return (
      <g transform={`translate(${x} ${y})`} className={`${s.badge} ${s.bWatch}`}>
        <path d="M0 -4.8 L4.4 3.2 L-4.4 3.2 Z" />
        <path d="M0 -2 L0 0.6 M0 1.9 L0 2" className={s.glyph} />
      </g>
    );
  if (status === "act")
    return (
      <g transform={`translate(${x} ${y})`} className={`${s.badge} ${s.bAct}`}>
        <path d="M-1.9 -4.5 L1.9 -4.5 L4.5 -1.9 L4.5 1.9 L1.9 4.5 L-1.9 4.5 L-4.5 1.9 L-4.5 -1.9 Z" />
        <path d="M0 -2.4 L0 0.7 M0 2.2 L0 2.3" className={s.glyph} />
      </g>
    );
  if (status === "stale")
    return (
      <g transform={`translate(${x} ${y})`} className={`${s.badge} ${s.bStale}`}>
        <circle r="4" />
        <path d="M0 -2.3 L0 0 L1.8 1.2" className={s.glyph} />
      </g>
    );
  return null;
}

export function BodyFigure({ view, model, selected, linked, onSelect, hidden = [] }: Props) {
  const uid = useId().replace(/:/g, "");
  const hatch = `bm-hatch-${uid}`;
  const arts = ART_BY_VIEW[view].filter((a) => !hidden.includes(a.id));
  const ids = ORDER.filter((id) => arts.some((a) => a.id === id));
  const [hover, setHover] = useState<RegionId | null>(null);
  const [focus, setFocus] = useState<RegionId | null>(null);
  const [roving, setRoving] = useState<RegionId>(ids[0]);
  const refs = useRef<Partial<Record<RegionId, SVGGElement | null>>>({});
  const tabStop = selected && ids.includes(selected) ? selected : roving;

  const regionClass = (id: RegionId) => {
    const st = model.regions[id].status;
    return [
      s.region,
      s[st],
      selected === id ? s.selected : "",
      hover === id || focus === id ? s.hot : "",
      linked ? (linked.has(id) ? s.linked : s.dimmed) : "",
    ].join(" ");
  };
  const hatched = (id: RegionId) => {
    const st = model.regions[id].status;
    return st === "unknown" || st === "stale" ? ({ "--fill": `url(#${hatch})` } as CSSProperties) : undefined;
  };

  const move = (from: RegionId, step: number) => {
    const i = ids.indexOf(from);
    const next = ids[(i + step + ids.length) % ids.length];
    setRoving(next);
    refs.current[next]?.focus();
  };
  const onKey = (id: RegionId) => (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); move(id, 1); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); move(id, -1); }
    else if (e.key === "Home") { e.preventDefault(); move(ids[0], 0); }
    else if (e.key === "End") { e.preventDefault(); move(ids[ids.length - 1], 0); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id, e.currentTarget); }
  };

  // Hit targets go on top of all artwork; the ring and the skin outline are lowest so organs win.
  const hitOrder = [...arts].sort((a, b) => Number(b.id === "whole_body") - Number(a.id === "whole_body"));

  return (
    <svg viewBox={VIEWBOX} className={s.figure} role="group" aria-label={`Body map, ${VIEW_NAME[view].toLowerCase()}. Use arrow keys to move between regions, Enter to open one.`}>
      <defs>
        <pattern id={hatch} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="3" className={s.hatchBg} />
          <line x1="0" y1="0" x2="0" y2="3" className={s.hatchLine} />
        </pattern>
      </defs>

      {/* back half of the HALO ring, behind the figure */}
      {!hidden.includes("whole_body") && (
        <g className={regionClass("whole_body")} aria-hidden="true">
          <path d={RING_BACK} className="line ring back" />
        </g>
      )}

      <g className={s.silhouette} aria-hidden="true">
        <ellipse {...HEAD} />
        <path d={HALF} />
        <path d={HALF} transform={MIRROR} />
      </g>

      {arts.map((a) => (
        <g key={a.id} className={regionClass(a.id)} style={hatched(a.id)} aria-hidden="true">
          {a.art}
        </g>
      ))}

      <g className={s.hits}>
        {hitOrder.map((a) => {
          const r = model.regions[a.id];
          return (
            <g
              key={a.id}
              ref={(el) => { refs.current[a.id] = el; }}
              role="button"
              tabIndex={tabStop === a.id ? 0 : -1}
              aria-label={r.ariaLabel}
              aria-pressed={selected === a.id}
              data-region={a.id}
              className={s.hit}
              onClick={(e) => { setRoving(a.id); onSelect(a.id, e.currentTarget); }}
              onKeyDown={onKey(a.id)}
              onPointerEnter={() => setHover(a.id)}
              onPointerLeave={() => setHover((h) => (h === a.id ? null : h))}
              onFocus={() => { setFocus(a.id); setRoving(a.id); }}
              onBlur={() => setFocus((f) => (f === a.id ? null : f))}
            >
              <title>{r.def.name}</title>
              {a.hit}
            </g>
          );
        })}
      </g>

      <g aria-hidden="true" className={s.badges}>
        {arts.map((a) => (
          <g key={a.id} className={linked && !linked.has(a.id) ? s.dimmed : ""}>
            <Badge status={model.regions[a.id].status} x={a.badge[0]} y={a.badge[1]} />
          </g>
        ))}
      </g>
    </svg>
  );
}
