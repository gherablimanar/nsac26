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
import controls from "./shared/Workbench.module.css";
import {
  api,
  query,
  pullCheckins,
  syncCheckins,
  localCheckins,
} from "./shared/api.ts";

const PROFILE_NAME =
  MISSION_PROFILE === "mars_transit"
    ? "Mars transit"
    : MISSION_PROFILE === "moon"
      ? "Moon surface"
      : "ISS";
const DELAY =
  MISSION_PROFILE === "mars_transit"
    ? "18 min"
    : MISSION_PROFILE === "moon"
      ? "1 s"
      : null;

const readLook = (): Look => {
  try {
    return localStorage.getItem("halo-look") === "plain" ? "plain" : "field";
  } catch {
    return "field";
  }
};

export default function App() {
  const [day, setDay] = useState(DEMO_DAY);
  const [revision, setRevision] = useState(0);
  const [backendStatus, setBackendStatus] = useState("On-device analysis");
  useEffect(() => {
    const change = () => setRevision((n) => n + 1);
    window.addEventListener("halo-data-change", change);
    window.addEventListener("online", syncCheckins);
    syncCheckins();
    return () => {
      window.removeEventListener("halo-data-change", change);
      window.removeEventListener("online", syncCheckins);
    };
  }, []);
  const [page, setPage] = useState<Page>("overview");
  const [crewId, setCrewId] = useState("C2"); // demo story: Marco Ricci
  useEffect(() => {
    let cancelled = false;
    pullCheckins({ crewId, day, profile: MISSION_PROFILE });
    api("/snapshot?" + query({ crewId, day, profile: MISSION_PROFILE }))
      .then(() => {
        if (!cancelled) setBackendStatus("Connected analysis");
      })
      .catch(() => {
        if (!cancelled) setBackendStatus("On-device analysis");
      });
    return () => {
      cancelled = true;
    };
  }, [crewId, day, revision]);
  const [look, setLook] = useState<Look>(readLook);
  const [system, setSystem] = useState<RegionId | null>(null);
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.look = look;
    try {
      localStorage.setItem("halo-look", look);
    } catch {
      /* storage blocked: keep in memory */
    }
  }, [look]);

  const openHealth = (id: RegionId) => {
    setSystem(id);
    setPage("health");
  };
  const navigate = (p: Page) => {
    setUrgent(false);
    setPage(p);
  };
  const risk = useMemo(
    () => buildOverview(crewId, day).risk,
    [crewId, day, revision],
  );
  const [planDone, setPlanDone] = useState<Record<string, string[]>>({});
  const done = planDone[crewId] ?? [];
  const setDone = (ids: string[]) =>
    setPlanDone((m) => ({ ...m, [crewId]: ids }));
  const actRisk =
    risk?.level === "act" && !easedToday(risk, done) ? risk : null;

  // Today's Daily Log, per crew member: the homepage asks once ("How are you doing?") until it's saved
  const [logged, setLogged] = useState<Record<string, boolean>>({});
  const [quickMood, setQuickMood] = useState<Record<string, number>>({});
  const [later, setLater] = useState<Record<string, boolean>>({});
  const [meds, setMeds] = useState<Record<string, MedDay>>({});
  const medKey = `${crewId}:${day}`;
  const medsToday =
    meds[medKey] ??
    (() => {
      try {
        return (
          JSON.parse(
            localStorage.getItem("halo-med-day-" + medKey) ?? "null",
          ) ?? EMPTY_DAY
        );
      } catch {
        return EMPTY_DAY;
      }
    })();
  const changeMeds = (state: MedDay) => {
    setMeds((m) => ({ ...m, [medKey]: state }));
    localStorage.setItem("halo-med-day-" + medKey, JSON.stringify(state));
    api("/medication-day", { crewId, day, state }).catch(() => {});
  };
  useEffect(() => {
    let cancelled = false;
    api("/medication-day?" + query({ crewId, day, profile: MISSION_PROFILE }))
      .then((r) => {
        if (
          !cancelled &&
          r.state &&
          !localStorage.getItem("halo-med-day-" + medKey)
        )
          setMeds((m) => ({ ...m, [medKey]: r.state }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [crewId, day]);
  const firstName = crewById(crewId).name.split(" ").slice(-2)[0];
  const askCheckin =
    page === "overview" &&
    !logged[crewId] &&
    !later[crewId] &&
    !localCheckins().some((l) => l.crewId === crewId && l.day === day);

  return (
    <>
      <Sidebar page={page} onNavigate={navigate} />
      <TopBar
        profile={MISSION_PROFILE}
        day={day}
        crew={SIM.crew}
        selected={crewById(crewId)}
        onSelect={setCrewId}
        onUrgentHelp={() => {
          setUrgent(true);
          setPage("assistant");
        }}
      />
      <main key={`${crewId}-${day}`} className={s.main}>
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
          <span>{backendStatus} · fictional crew · demo rules</span>
        </div>
        {actRisk && page !== "overview" && (
          <RiskBanner risk={actRisk} onOpen={() => navigate("overview")} />
        )}
        {page === "overview" && (
          <Overview
            key={`${crewId}-${day}-${revision}`}
            crewId={crewId}
            day={day}
            delay={DELAY}
            onOpenHealth={openHealth}
            done={done}
            onDone={setDone}
            logged={!!logged[crewId]}
            meds={medsToday}
            profileName={PROFILE_NAME}
            onNavigate={navigate}
          />
        )}
        {page === "settings" && <Settings look={look} onLook={setLook} />}
        {page === "health" && (
          <Health
            key={`${crewId}-${day}-${revision}`}
            crewId={crewId}
            day={day}
            selected={system}
            onSelect={setSystem}
          />
        )}
        {page === "log" && (
          <DailyLog
            crewId={crewId}
            day={day}
            quickMood={quickMood[crewId] ?? null}
            onSaved={() => setLogged((m) => ({ ...m, [crewId]: true }))}
          />
        )}
        {page === "assistant" && (
          <Assistant crewId={crewId} day={day} delay={DELAY} urgent={urgent} />
        )}
        {page === "mission" && <Mission crewId={crewId} day={day} />}
        {page === "medicines" && (
          <Medicines
            crewId={crewId}
            day={day}
            delay={DELAY}
            today={medsToday}
            onChange={changeMeds}
          />
        )}
        {page === "evidence" && <Evidence />}
      </main>
      {askCheckin && (
        <QuickCheckin
          key={`${crewId}-${day}`}
          name={firstName}
          day={day}
          mood={quickMood[crewId] ?? null}
          onMood={(m) => setQuickMood((q) => ({ ...q, [crewId]: m }))}
          onOpenLog={() => {
            setLater((l) => ({ ...l, [crewId]: true }));
            navigate("log");
          }}
          onTalk={() => {
            setLater((l) => ({ ...l, [crewId]: true }));
            navigate("assistant");
          }}
          onLater={() => setLater((l) => ({ ...l, [crewId]: true }))}
        />
      )}
    </>
  );
}
