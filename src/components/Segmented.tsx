import { useLayoutEffect, useRef, useState } from "react";
import s from "./Segmented.module.css";

type Option<T extends string> = { id: T; label: string; attention?: boolean };

/** A small set of mutually exclusive views (e.g. body layers, mission profile). Max ~4 options. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);

  // The white thumb slides to the pressed option; re-measure once the web font has loaded
  useLayoutEffect(() => {
    const measure = () => {
      const el = track.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [value, options.length]);

  return (
    <div ref={track} className={s.track} role="group" aria-label={label}>
      {thumb && <span className={s.thumb} aria-hidden="true" style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }} />}
      {options.map((o) => (
        <button key={o.id} type="button" className={`${s.opt} ${o.attention ? s.attention : ""}`} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}{o.attention && <span className={s.vh}>, needs attention</span>}
        </button>
      ))}
    </div>
  );
}
