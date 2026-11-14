import { useEffect, useRef, useState } from "react";
import { CaretDown, Check, FirstAid } from "@phosphor-icons/react";
import type { CrewMember, MissionProfile } from "../engine/types.ts";
import glass from "./Glass.module.css";
import s from "./TopBar.module.css";
import { useShine } from "./useShine";

const MISSION: Record<MissionProfile, { name: string; delay: string | null }> = {
  mars_transit: { name: "Mars transit", delay: "18 min" }, // DEMO: one-way light time varies, up to ~20 min
  moon: { name: "Moon surface", delay: "1 s" },
  iss: { name: "ISS", delay: null },
};

const initials = (name: string) => name.split(" ").slice(-2).map((w) => w[0]).join("");

type Props = {
  profile: MissionProfile;
  day: number;
  crew: CrewMember[];
  selected: CrewMember;
  onSelect: (id: string) => void;
  onUrgentHelp: () => void;
};

export function TopBar({ profile, day, crew, selected, onSelect, onUrgentHelp }: Props) {
  const ref = useRef<HTMLElement>(null);
  useShine(ref);
  const [open, setOpen] = useState(false);
  const m = MISSION[profile];
  const shortName = selected.name.split(" ").slice(-2).join(" ");

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [open]);

  return (
    <header ref={ref} className={`${glass.glass} ${s.top}`}>
      <span><span className={`mono ${s.day}`}>Day {day}</span>&nbsp;&nbsp;<span className={s.dim}>{m.name}</span></span>
      <span className={`${s.dim} ${s.push}`}>Synced 3 min ago</span>
      <span className={s.dim}>
        {m.delay ? <>Houston hears you in <span className="mono">{m.delay}</span></> : "Live link to Houston"}
      </span>
      <div className={s.whoWrap}>
        <button className={s.who} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span className={s.avatar}>{initials(selected.name)}</span>{shortName}<CaretDown size={14} className={s.dim} />
        </button>
        {open && (
          <ul className={s.menu} role="listbox" aria-label="Astronaut">
            {crew.map((c) => (
              <li key={c.id} role="option" aria-selected={c.id === selected.id}>
                <button onClick={() => { onSelect(c.id); setOpen(false); }}>
                  <span><b>{c.name.split(" ").slice(-2).join(" ")}</b><small>{c.role}</small></span>
                  {c.id === selected.id && <Check size={16} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Solid on purpose: the one control that must be found instantly */}
      <button className={s.help} onClick={onUrgentHelp}><FirstAid size={18} />Urgent help</button>
    </header>
  );
}
