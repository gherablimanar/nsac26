import { useEffect, useMemo, useState } from "react";
import { Sidebar, type Page } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DEMO_DAY, MISSION_PROFILE, SIM, crewById } from "./data/crew.ts";
import { Overview } from "./pages/Overview";
import { RiskBanner } from "./components/RiskBanner";
import { buildOverview, easedToday } from "./ui/overviewData.ts";
import { Health } from "./pages/Health";
import { DailyLog } from "./pages/DailyLog";
import { Assistant } from "./pages/Assistant";
import { Mission } from "./pages/Mission";
import { Medicines } from "./pages/Medicines";
import { Evidence } from "./pages/Evidence";
import { Settings, type Look } from "./pages/Settings";
import { QuickCheckin } from "./components/QuickCheckin";
import { EMPTY_DAY, type MedDay } from "./ui/medicinesData.ts";
import type { RegionId } from "./bodymap/regions.ts";
import s from "./App.module.css";

const PROFILE_NAME = MISSION_PROFILE === "mars_transit" ? "Mars transit" : MISSION_PROFILE === "moon" ? "Moon surface" : "ISS";
const DELAY = MISSION_PROFILE === "mars_transit" ? "18 min" : MISSION_PROFILE === "moon" ? "1 s" : null;

const readLook = (): Look => {
  try { return localStorage.getItem("halo-look") === "plain" ? "plain" : "field"; } catch { return "field"; }
};

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [crewId, setCrewId] = useState("C2"); // demo story: Marco Ricci
  const [look, setLook] = useState<Look>(readLook);
  const [system, setSystem] = useState<RegionId | null>(null);
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.look = look;
    try { localStorage.setItem("halo-look", look); } catch { /* storage blocked: keep in memory */ }
  }, [look]);

  const openHealth = (id: RegionId) => { setSystem(id); setPage("health"); };
  const navigate = (p: Page) => { setUrgent(false); setPage(p); };
  const risk = useMemo(() => buildOverview(crewId, DEMO_DAY).risk, [crewId]);
  const [planDone, setPlanDone] = useState<Record<string, string[]>>({});
  const done = planDone[crewId] ?? [];
  const setDone = (ids: string[]) => setPlanDone((m) => ({ ...m, [crewId]: ids }));
  const actRisk = risk?.level === "act" && !easedToday(risk, done) ? risk : null;

  // Today's Daily Log, per crew member: the homepage asks once ("How are you doing?") until it's saved
  const [logged, setLogged] = useState<Record<string, boolean>>({});
  const [quickMood, setQuickMood] = useState<Record<string, number>>({});
  const [later, setLater] = useState<Record<string, boolean>>({});
  const [meds, setMeds] = useState<Record<string, MedDay>>({});
  const medsToday = meds[crewId] ?? EMPTY_DAY;
  const firstName = crewById(crewId).name.split(" ").slice(-2)[0];
  const askCheckin = page === "overview" && !logged[crewId] && !later[crewId];

  return (
    <>
      <Sidebar page={page} onNavigate={navigate} />
      <TopBar profile={MISSION_PROFILE} day={DEMO_DAY} crew={SIM.crew} selected={crewById(crewId)}
        onSelect={setCrewId} onUrgentHelp={() => { setUrgent(true); setPage("assistant"); }} />
      <main key={crewId} className={s.main}>
        {actRisk && page !== "overview" && <RiskBanner risk={actRisk} onOpen={() => navigate("overview")} />}
        {page === "overview" && <Overview key={crewId} crewId={crewId} day={DEMO_DAY} delay={DELAY} onOpenHealth={openHealth} done={done} onDone={setDone}
          logged={!!logged[crewId]} meds={medsToday} profileName={PROFILE_NAME} onNavigate={navigate} />}
        {page === "settings" && <Settings look={look} onLook={setLook} />}
        {page === "health" && <Health crewId={crewId} day={DEMO_DAY} selected={system} onSelect={setSystem} />}
        {page === "log" && <DailyLog crewId={crewId} day={DEMO_DAY} quickMood={quickMood[crewId] ?? null}
          onSaved={() => setLogged((m) => ({ ...m, [crewId]: true }))} />}
        {page === "assistant" && <Assistant crewId={crewId} day={DEMO_DAY} delay={DELAY} urgent={urgent} />}
        {page === "mission" && <Mission crewId={crewId} day={DEMO_DAY} />}
        {page === "medicines" && <Medicines crewId={crewId} day={DEMO_DAY} delay={DELAY} today={medsToday}
          onChange={(d) => setMeds((m) => ({ ...m, [crewId]: d }))} />}
        {page === "evidence" && <Evidence />}
      </main>
      {askCheckin && (
        <QuickCheckin key={crewId} name={firstName} day={DEMO_DAY} mood={quickMood[crewId] ?? null}
          onMood={(m) => setQuickMood((q) => ({ ...q, [crewId]: m }))}
          onOpenLog={() => { setLater((l) => ({ ...l, [crewId]: true })); navigate("log"); }}
          onTalk={() => { setLater((l) => ({ ...l, [crewId]: true })); navigate("assistant"); }}
          onLater={() => setLater((l) => ({ ...l, [crewId]: true }))} />
      )}
    </>
  );
}
