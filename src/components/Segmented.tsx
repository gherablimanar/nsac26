import s from "./Segmented.module.css";

type Option<T extends string> = { id: T; label: string };

/** A small set of mutually exclusive views (e.g. body layers, mission profile). Max ~4 options. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className={s.track} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" className={s.opt} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
