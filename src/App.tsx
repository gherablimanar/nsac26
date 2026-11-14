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
import controls from "./shared/Workbench.module.css";
import type { MissionProfile } from "./engine/types.ts";
import { api, query, pullCheckins, syncCheckins } from "./shared/api.ts";

const readLook = (): Look => {
  try {
    return localStorage.getItem("halo-look") === "plain" ? "plain" : "field";
  } catch {
    return "field";
  }
};

export default function App() {
  const [day, setDay] = useState(DEMO_DAY);
  const [profile, setProfile] = useState<MissionProfile>(MISSION_PROFILE);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const change = () => setRevision((x) => x + 1);
    window.addEventListener("halo-data-change", change);
    window.addEventListener("online", syncCheckins);
    syncCheckins();
    return () => {
      window.removeEventListener("halo-data-change", change);
      window.removeEventListener("online", syncCheckins);
    };
  }, []);
  const delay =
    profile === "mars_transit" ? "20 min" : profile === "moon" ? "1 s" : null;
  const [page, setPage] = useState<Page>("overview");
  const [crewId, setCrewId] = useState("C2"); // demo story: Marco Ricci
  const [serverSnapshot, setServerSnapshot] = useState<any>(null);
  useEffect(() => {
    let cancelled = false;
    setServerSnapshot(null);
    pullCheckins({ crewId, day, profile });
    api("/snapshot?" + query({ crewId, day, profile }))
      .then((value) => {
        if (!cancelled) setServerSnapshot(value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [crewId, day, profile, revision]);
  useEffect(() => {
    const go = (event: Event) => setPage((event as CustomEvent).detail);
    window.addEventListener("halo-navigate", go);
    return () => window.removeEventListener("halo-navigate", go);
  }, []);
  const [look, setLook] = useState<Look>(readLook);
  const [system, setSystem] = useState<BodySystemId | null>(null);
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.look = look;
    try {
      localStorage.setItem("halo-look", look);
    } catch {
      /* storage blocked: keep in memory */
    }
  }, [look]);

  const openHealth = (id: BodySystemId) => {
    setSystem(id);
    setPage("health");
  };
  const navigate = (p: Page) => {
    setUrgent(false);
    setPage(p);
  };

  return (
    <>
      {page === "overview" && <Field state={overviewState(crewId, day)} />}
      <Sidebar page={page} onNavigate={navigate} />
      <TopBar
        profile={profile}
        day={day}
        crew={SIM.crew}
        selected={crewById(crewId)}
        onSelect={setCrewId}
        onUrgentHelp={() => {
          setUrgent(true);
          setPage("assistant");
        }}
      />
      <main className={s.main}>
        <div className={controls.toolbar}>
          <label>
            Demo day{" "}
            <input
              aria-label="Demo day"
              type="number"
              min="1"
              max="120"
              value={day}
              onChange={(e) =>
                setDay(Math.max(1, Math.min(120, Number(e.target.value) || 1)))
              }
            />
          </label>
          <label>
            Mission{" "}
            <select
              aria-label="Mission"
              value={profile}
              onChange={(e) => setProfile(e.target.value as MissionProfile)}
            >
              <option value="mars_transit">Mars transit</option>
              <option value="iss">ISS</option>
              <option value="moon">Moon</option>
            </select>
          </label>
          <button
            className={controls.secondary}
            onClick={() => {
              setCrewId("C2");
              setDay(50);
            }}
          >
            Before hydration event
          </button>
          <button
            className={controls.secondary}
            onClick={() => {
              setCrewId("C2");
              setDay(60);
            }}
          >
            Hydration pattern
          </button>
          <button
            className={controls.secondary}
            onClick={() => {
              setCrewId("C1");
              setDay(40);
            }}
          >
            Radiation event
          </button>
          <button
            className={controls.secondary}
            onClick={() => {
              setCrewId("C3");
              setDay(70);
            }}
          >
            Readiness event
          </button>
          <span>
            Simulated crew · demo rules · not a medical device ·{" "}
            {serverSnapshot ? "Connected analysis" : "On-device analysis"}
          </span>
        </div>
        {page === "overview" && (
          <Overview
            assessment={
              serverSnapshot?.selection.crewId === crewId &&
              serverSnapshot?.selection.day === day
                ? serverSnapshot.assessment
                : undefined
            }
            key={revision}
            profile={profile}
            crewId={crewId}
            day={day}
            delay={delay}
            onOpenHealth={openHealth}
          />
        )}
        {page === "settings" && <Settings look={look} onLook={setLook} />}
        {page === "health" && (
          <Health
            crewId={crewId}
            day={day}
            selected={system}
            onSelect={setSystem}
          />
        )}
        {page === "log" && (
          <DailyLog
            key={`${crewId}-${day}`}
            profile={profile}
            crewId={crewId}
            day={day}
          />
        )}
        {page === "assistant" && (
          <Assistant
            profile={profile}
            crewId={crewId}
            day={day}
            delay={delay}
            urgent={urgent}
          />
        )}
        {page === "mission" && (
          <Mission profile={profile} crewId={crewId} day={day} />
        )}
        {page === "medicines" && (
          <Medicines profile={profile} crewId={crewId} day={day} />
        )}
        {page === "evidence" && <Evidence />}
      </main>
    </>
  );
}
