import { useRef } from "react";
import { Books, ChatCircleText, GearSix, Heartbeat, NotePencil, Pill, Planet, SquaresFour, type Icon } from "@phosphor-icons/react";
import glass from "./Glass.module.css";
import s from "./Sidebar.module.css";
import { useShine } from "./useShine";

export type Page = "overview" | "health" | "log" | "assistant" | "mission" | "medicines" | "evidence" | "settings";

const MAIN: { id: Page; label: string; icon: Icon }[] = [
  { id: "overview", label: "Overview", icon: SquaresFour },
  { id: "health", label: "Health", icon: Heartbeat },
  { id: "log", label: "Daily Log", icon: NotePencil },
  { id: "assistant", label: "Assistant", icon: ChatCircleText },
  { id: "mission", label: "Mission", icon: Planet },
  { id: "medicines", label: "Medicines", icon: Pill },
];
const UTIL: { id: Page; label: string; icon: Icon }[] = [
  { id: "evidence", label: "Evidence", icon: Books },
  { id: "settings", label: "Settings", icon: GearSix },
];

export function Sidebar({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  const ref = useRef<HTMLElement>(null);
  useShine(ref);
  const item = ({ id, label, icon: I }: (typeof MAIN)[number]) => (
    <a key={id} href={`#${id}`} className={s.item} aria-current={page === id ? "page" : undefined}
      onClick={(e) => { e.preventDefault(); onNavigate(id); }}>
      <I size={20} /><span>{label}</span>
    </a>
  );
  return (
    <aside ref={ref} className={`${glass.glass} ${s.side}`}>
      <div className={s.brand}>
        <svg viewBox="0 0 26 14" fill="none" aria-hidden="true"><ellipse cx="13" cy="7" rx="11.5" ry="5" stroke="currentColor" strokeWidth="2" /></svg>
        <span>HALO</span>
      </div>
      <nav className={s.nav} aria-label="Main">{MAIN.map(item)}</nav>
      <div className={s.end}>
        <nav className={s.nav} aria-label="Utilities">{UTIL.map(item)}</nav>
        <p className={s.proto}>Prototype, not a medical device</p>
      </div>
    </aside>
  );
}
