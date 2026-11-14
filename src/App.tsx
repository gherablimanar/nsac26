import { useEffect, useState } from "react";
import { Sidebar, type Page } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DEMO_DAY, MISSION_PROFILE, SIM, crewById } from "./data/crew.ts";
import { Field, Overview, overviewState } from "./pages/Overview";
import { Health } from "./pages/Health";
import { DailyLog } from "./pages/DailyLog";
import { Assistant } from "./pages/Assistant";
import { Mission } from "./pages/Mission";
import { Medicines } from "./pages/Medicines";
import { Evidence } from "./pages/Evidence";
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
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.look = look;
    try { localStorage.setItem("halo-look", look); } catch { /* storage blocked: keep in memory */ }
  }, [look]);

  const openHealth = (id: BodySystemId) => { setSystem(id); setPage("health"); };
  const navigate = (p: Page) => { setUrgent(false); setPage(p); };

  return (
    <>
      {page === "overview" && <Field state={overviewState(crewId, DEMO_DAY)} />}
      <Sidebar page={page} onNavigate={navigate} />
      <TopBar profile={MISSION_PROFILE} day={DEMO_DAY} crew={SIM.crew} selected={crewById(crewId)}
        onSelect={setCrewId} onUrgentHelp={() => { setUrgent(true); setPage("assistant"); }} />
      <main className={s.main}>
        {page === "overview" && <Overview crewId={crewId} day={DEMO_DAY} delay={DELAY} onOpenHealth={openHealth} />}
        {page === "settings" && <Settings look={look} onLook={setLook} />}
        {page === "health" && <Health crewId={crewId} day={DEMO_DAY} selected={system} onSelect={setSystem} />}
        {page === "log" && <DailyLog crewId={crewId} day={DEMO_DAY} />}
        {page === "assistant" && <Assistant crewId={crewId} day={DEMO_DAY} delay={DELAY} urgent={urgent} />}
        {page === "mission" && <Mission crewId={crewId} day={DEMO_DAY} />}
        {page === "medicines" && <Medicines crewId={crewId} day={DEMO_DAY} />}
        {page === "evidence" && <Evidence />}
      </main>
    </>
  );
}
