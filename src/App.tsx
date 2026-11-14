import { useEffect, useState } from "react";
import { Sidebar, type Page } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DEMO_DAY, MISSION_PROFILE, SIM, crewById } from "./data/crew.ts";
import { Field, Overview, overviewState } from "./pages/Overview";
import { Placeholder } from "./pages/Placeholder";
import { Settings, type Look } from "./pages/Settings";
import type { BodySystemId } from "./ui/viewTypes.ts";
import s from "./App.module.css";

const DELAY = MISSION_PROFILE === "mars_transit" ? "18 min" : MISSION_PROFILE === "moon" ? "1 s" : null;

const readLook = (): Look => {
  try { return localStorage.getItem("halo-look") === "plain" ? "plain" : "field"; } catch { return "field"; }
};

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [crewId, setCrewId] = useState("C2"); // demo story: Marco Ricci
  const [look, setLook] = useState<Look>(readLook);
  const [system, setSystem] = useState<BodySystemId | null>(null);

  useEffect(() => {
    document.documentElement.dataset.look = look;
    try { localStorage.setItem("halo-look", look); } catch { /* storage blocked: keep in memory */ }
  }, [look]);

  const openHealth = (id: BodySystemId) => { setSystem(id); setPage("health"); };

  return (
    <>
      {page === "overview" && <Field state={overviewState(crewId, DEMO_DAY)} />}
      <Sidebar page={page} onNavigate={setPage} />
      <TopBar profile={MISSION_PROFILE} day={DEMO_DAY} crew={SIM.crew} selected={crewById(crewId)}
        onSelect={setCrewId} onUrgentHelp={() => setPage("assistant")} />
      <main className={s.main}>
        {page === "overview" && <Overview crewId={crewId} day={DEMO_DAY} delay={DELAY} onOpenHealth={openHealth} />}
        {page === "settings" && <Settings look={look} onLook={setLook} />}
        {page === "health" && <Placeholder title="Health" note={`Details for ${system ?? "every body system"} go here: trends against your normal band, with why each reading matters in space.`} />}
        {page === "log" && <Placeholder title="Daily Log" note="Check-in forms for fluid, urine colour, mood and the reaction test go here." />}
        {page === "assistant" && <Placeholder title="Assistant" note="The AI medical officer goes here. Red-flag rules run first; it never gives drug doses." />}
        {page === "mission" && <Placeholder title="Mission" note="Mission profile, radiation dose and the readiness gate before a spacewalk go here." />}
        {page === "medicines" && <Placeholder title="Medicines" note="The flight surgeon's dosing schedule and the potency forecast go here." />}
        {page === "evidence" && <Placeholder title="Evidence" note="The NASA sources behind every rule and signal go here." />}
      </main>
    </>
  );
}
