import { api } from "../shared/api.ts";
import { answer as offlineAnswer } from "../shared/offlineAssistant.ts";
import { assessCrew } from "../engine/assessment.ts";
import { historyOf, contextOf, MISSION_PROFILE } from "../data/crew.ts";
import { readiness as assessReadiness } from "../engine/assessment.ts";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CaretRight,
  ChartLineUp,
  Check,
  ClockCounterClockwise,
  FileText,
  Microphone,
  Paperclip,
  X,
  RocketLaunch,
  ShieldCheck,
  Stethoscope,
} from "@phosphor-icons/react";
import card from "../components/Card.module.css";
import { HaloMark } from "../components/HaloMark";
import { PageHero } from "../components/PageHero";
import { More } from "../components/More";
import { LiquidGlassButton } from "../components/ui/apple-tahoe-liquid-glass-button";
import { driftOn } from "../ui/systems.ts";
import { crewById, readingOn } from "../data/crew.ts";
import { buildOverview } from "../ui/overviewData.ts";
import { GATE_OF, worstGate } from "../ui/missionData.ts";
import { SYSTEMS, systemStatus } from "../ui/systems.ts";
import {
  EMPTY_QUICK,
  NOTE_TEXT,
  SEED_C2,
  haloMsg,
  respond,
  userMsg,
  type Block,
  type Message,
} from "../ui/assistantData.ts";
import s from "./Assistant.module.css";

type Props = {
  crewId: string;
  day: number;
  delay: string | null;
  urgent: boolean;
};

const mono = (t: string) => <span className="mono">{t}</span>;

function Emergency({
  title,
  text,
  delay,
}: {
  title: string;
  text: string;
  delay: string | null;
}) {
  const [started, setStarted] = useState(false);
  return (
    <div className={s.emergency} role="alert">
      <h2 className={s.emTitle}>{title}</h2>
      <p className={s.emText}>{text}</p>
      <button
        type="button"
        className={s.emBtn}
        onClick={() => setStarted(true)}
      >
        Start emergency protocol
      </button>
      {started ? (
        <p className={s.emNote}>
          Emergency guidance opened. Nothing transmitted. Scenario delay:{" "}
          {delay ? <>in {mono(delay)}</> : "right away"}.
        </p>
      ) : (
        <p className={s.emNote}>
          No report is automatically sent. Follow the onboard emergency
          procedure.
        </p>
      )}
    </div>
  );
}

function NoteRow({ delay }: { delay: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.noteRow}>
      <div className={s.noteLine}>
        <span>
          Illustrative report preview; not queued or sent. Scenario delay:{" "}
          {mono(delay ?? "moments")}.
        </span>
        <LiquidGlassButton asChild interactive material="clear">
          <button
            type="button"
            className={s.glassBtn}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide note" : "View note"}
          </button>
        </LiquidGlassButton>
      </div>
      {open && <p className={s.notePreview}>{NOTE_TEXT}</p>}
    </div>
  );
}

export function Assistant({ crewId, day, delay, urgent }: Props) {
  const drift = useMemo(() => driftOn(crewId, day), [crewId, day]);
  const risk = useMemo(() => buildOverview(crewId, day).risk, [crewId, day]);
  // Start screen first: when you're fine it should be obvious what this page is for
  const [mode, setMode] = useState<"start" | "chat">(urgent ? "chat" : "start");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const area = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [file, setFile] = useState<File | null>(null);
  // The conversation card runs to the bottom of the screen: tiles at the top, the typing bar at the bottom
  const convo = useRef<HTMLElement>(null);
  const [convoH, setConvoH] = useState<number>();
  useLayoutEffect(() => {
    const fit = () => {
      let y = 0;
      for (
        let n: HTMLElement | null = convo.current;
        n;
        n = n.offsetParent as HTMLElement | null
      )
        y += n.offsetTop;
      setConvoH(Math.max(480, window.innerHeight - y - 24));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [mode]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setMessages([]);
    setMode(urgent ? "chat" : "start");
  }, [crewId, urgent]);
  useEffect(() => {
    if (urgent) input.current?.focus();
  }, [urgent]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    const el = area.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async (raw: string) => {
    const t = [
      raw.trim(),
      file ? `Selected file: ${file.name} (contents not analyzed)` : "",
    ]
      .filter(Boolean)
      .join("\n");
    if (!t) return;
    setFile(null);
    setMode("chat");
    setMessages((m) => [...m, userMsg(t)]);
    setText("");
    let result;
    try {
      result = await api("/assistant", {
        crewId,
        day,
        profile: MISSION_PROFILE,
        question: raw.trim() || "Explain available data",
        symptoms: [],
        allowAI: sessionStorage.getItem("halo-allow-ai") === "true",
      });
    } catch {
      result = offlineAnswer(
        raw,
        assessCrew(
          historyOf(crewId),
          day,
          MISSION_PROFILE,
          contextOf(crewId, day),
        ),
      );
    }
    const blocks: Block[] = [
      { kind: "text", text: result.explanation },
      { kind: "text", text: result.escalation },
      {
        kind: "text",
        text: "Mode: " + result.mode + ". " + result.limitations,
      },
    ];
    if (result.citations?.length)
      blocks.push({
        kind: "text",
        text: result.citations.map((e: any) => e.title).join("; "),
      });
    setMessages((m) => [...m, haloMsg(blocks)]);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(text);
    }
  };

  const fluid = drift.fluid_intake_ml,
    urine = drift.urine_color_1to8,
    sodium = drift.sodium_mg;
  const today = readingOn(crewId, day); // shown values = today's reading, like Overview and Health
  const litres = (v: number) => (v / 1000).toFixed(2);
  const fluidText = fluid && today ? `${litres(today.fluid_intake_ml)} L` : "";
  const fluidBand = fluid
    ? `(your normal ${litres(fluid.bandLo)}-${litres(fluid.bandHi)} L)`
    : "";
  const urineText = urine && today ? `${today.urine_color_1to8} of 8` : "";
  const urineBand = urine
    ? `(your normal up to ${Math.round(urine.bandHi)})`
    : "";
  const sodiumText =
    sodium && today ? `${today.sodium_mg.toLocaleString("en-US")} mg` : "";
  const sodiumBand =
    sodium && sodium.status !== "inside band" ? "(above your normal)" : "";

  const renderBlock = (b: Block, i: number): ReactNode => {
    switch (b.kind) {
      case "text":
        return (
          <p key={i} className={s.p}>
            {b.text}
          </p>
        );
      case "check":
        return (
          <div key={i} className={s.check}>
            <ShieldCheck size={20} color="var(--ink-2)" />
            <span>{b.text}</span>
          </div>
        );
      case "evidence":
        return (
          <ul key={i} className={s.evidence}>
            <li>
              Fluid intake today: {mono(fluidText)} {fluidBand}
            </li>
            <li>
              Urine colour: {mono(urineText)} {urineBand}
            </li>
            <li>
              Sodium: {mono(sodiumText)} {sodiumBand}
            </li>
          </ul>
        );
      case "action":
        return (
          <p key={i} className={`${s.p} ${s.action}`}>
            {b.text}
          </p>
        );
      case "escalation":
        return (
          <p key={i} className={s.escalation}>
            If the pain becomes severe, or you see blood in your urine, use
            Urgent help.{" "}
            {delay ? (
              <>Scenario one-way delay: {mono(delay)}.</>
            ) : (
              "This interface does not transmit reports."
            )}
          </p>
        );
      case "quick":
        return (
          <div key={i} className={s.quick}>
            {b.options.map((o) => (
              <button
                key={o}
                type="button"
                className={s.quickBtn}
                onClick={() => send(o)}
              >
                {o}
              </button>
            ))}
          </div>
        );
      case "note":
        return <NoteRow key={i} delay={delay} />;
      case "emergency":
        return (
          <Emergency key={i} title={b.title} text={b.text} delay={delay} />
        );
    }
  };

  const rowVal = (out: boolean) => (out ? `mono ${s.out}` : "mono");

  // One-line status so you know where you stand before choosing anything
  const flagged = SYSTEMS.filter((d) => systemStatus(d, drift) === "watch").map(
    (d) => d.label,
  );
  const status = risk ? (
    <>
      <b className={risk.level === "act" ? s.act : s.watch}>
        {risk.level === "act" ? "Act" : "Watch"}
      </b>
      &nbsp;&nbsp;{risk.title.replace(/ is rising$/, "")} since Day{" "}
      {risk.sinceDay}.
    </>
  ) : flagged.length ? (
    <>
      No linked risks. {flagged.join(" and ")}{" "}
      {flagged.length === 1 ? "is" : "are"} outside your normal range on{" "}
      {flagged.length === 1 ? "its" : "their"} own.
    </>
  ) : (
    <>
      No configured coupled pattern is active. Review missing inputs and
      symptoms.
    </>
  );

  // Entry points use shared assessments and safety-screened explanations.
  const readiness = assessReadiness(
    historyOf(crewId),
    day,
    MISSION_PROFILE,
    contextOf(crewId, day),
  ).status;
  const start = (kind: "symptom" | "readings" | "task") => {
    setMode("chat");
    if (kind === "symptom") {
      setMessages([
        haloMsg([
          {
            kind: "text",
            text: "Tell me what you feel and where. I check for emergency signs first, then compare it with your readings.",
          },
          { kind: "quick", options: EMPTY_QUICK },
        ]),
      ]);
      setTimeout(() => input.current?.focus(), 0);
    } else if (kind === "readings") {
      void send("Explain my current measurements and missing inputs.");
    } else {
      setMessages([
        haloMsg([
          {
            kind: "text",
            text: `Readiness today: ${readiness}. HALO checks your sleep, reaction time and radiation against your own normal.`,
          },
          {
            kind: "text",
            text:
              readiness === "Go"
                ? "No configured demo threshold crossed; this is not medical or operational clearance. Review Mission with the crew medical officer."
                : "Look at the full check on Mission before any spacewalk or docking.",
          },
        ]),
      ]);
    }
  };

  return (
    <div>
      <PageHero
        page="Assistant"
        state={risk?.level ?? "normal"}
        title={
          <span className={s.heroTitle}>
            <HaloMark size={48} className={s.heroMark} />
            {mode === "start"
              ? `How are you feeling, ${crewById(crewId).name.split(" ").slice(-2)[0]}?`
              : "HALO is listening"}
          </span>
        }
        line={
          mode === "start"
            ? status
            : "Deterministic safety screen first. Hosted AI is optional; offline explanations remain available."
        }
      />
      <div className={s.grid}>
        <section
          ref={convo}
          className={`${card.card} ${s.convo}`}
          style={{ height: convoH }}
          aria-label="Conversation with HALO"
        >
          <div className={s.messages} ref={area}>
            {mode === "start" && (
              <div className={s.start}>
                <div className={s.choices}>
                  {(
                    [
                      [
                        "symptom",
                        Stethoscope,
                        "Report a symptom",
                        "Pain, headache, vision, anything that feels off.",
                      ],
                      [
                        "readings",
                        ChartLineUp,
                        "Ask about my readings",
                        "What changed, and what's normal for you.",
                      ],
                      [
                        "task",
                        RocketLaunch,
                        "Prepare for a task",
                        "Spacewalk or docking: are you ready today?",
                      ],
                    ] as const
                  ).map(([k, Icon, t, d]) => (
                    <button
                      key={k}
                      type="button"
                      className={s.choice}
                      onClick={() => start(k)}
                    >
                      <span className={s.choiceIcon}>
                        <Icon size={22} />
                      </span>
                      <b>{t}</b>
                      <small>{d}</small>
                      <CaretRight size={18} className={s.choiceGo} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mode === "chat" && (
              <button
                type="button"
                className={s.back}
                onClick={() => {
                  setMessages([]);
                  setMode("start");
                }}
              >
                <ArrowLeft size={16} />
                New conversation
              </button>
            )}
            {urgent && (
              <Emergency
                title="Urgent help"
                text="Tell me what's happening, or start the emergency protocol now."
                delay={delay}
              />
            )}
            {messages.map((m) =>
              m.from === "user" ? (
                <div key={m.id} className={s.user}>
                  {m.text}
                </div>
              ) : (
                <div key={m.id} className={s.halo}>
                  <div className={s.label}>
                    <HaloMark size={20} />
                    HALO
                  </div>
                  {m.blocks.map(renderBlock)}
                </div>
              ),
            )}
          </div>
          {file && (
            <div className={s.fileChip}>
              <FileText size={16} />
              {file.name}
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFile(null)}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          )}
          <div className={s.composer}>
            <input
              id="assistant-file"
              type="file"
              className={s.vh}
              accept="image/*,.pdf,.txt,.csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <label htmlFor="assistant-file" className={s.attach}>
              <Paperclip size={18} />
              Upload file
            </label>
            <label htmlFor="assistant-input" className={s.vh}>
              Describe how you feel
            </label>
            <textarea
              id="assistant-input"
              ref={input}
              className={s.input}
              rows={1}
              placeholder={
                mode === "start"
                  ? "Or describe it in your own words"
                  : "Describe how you feel"
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
            />
            <button
              type="button"
              className={s.mic}
              disabled
              aria-label="Voice input unavailable"
            >
              <Microphone size={20} />
            </button>
            <button type="button" className={s.cta} onClick={() => send(text)}>
              Send
            </button>
          </div>
        </section>

        <div className={s.context}>
          <section className={card.card} aria-labelledby="using-h">
            <div className={card.head}>
              <h2 id="using-h">What HALO is using</h2>
            </div>
            <dl className={s.rows}>
              <div>
                <dt>Mission day</dt>
                <dd>Day {mono(String(day))}, Mars transit</dd>
              </div>
              <div>
                <dt>Houston delay</dt>
                <dd>{delay ? <>{mono(delay)} one way</> : "Live"}</dd>
              </div>
              <div>
                <dt>Linked risk</dt>
                <dd>
                  {risk
                    ? `${risk.title.replace(/ is rising$/, "")}, ${risk.level === "act" ? "Act" : "Watch"} since Day ${risk.sinceDay}`
                    : "None right now"}
                </dd>
              </div>
              {fluid && (
                <div>
                  <dt>Fluid intake</dt>
                  <dd className={rowVal(fluid.status !== "inside band")}>
                    {fluidText}
                  </dd>
                </div>
              )}
              {urine && (
                <div>
                  <dt>Urine colour</dt>
                  <dd className={rowVal(urine.status !== "inside band")}>
                    {urineText}
                  </dd>
                </div>
              )}
              {sodium && (
                <div>
                  <dt>Sodium</dt>
                  <dd className={rowVal(sodium.status !== "inside band")}>
                    {sodiumText}
                  </dd>
                </div>
              )}
            </dl>
          </section>
          <section className={card.card} aria-labelledby="guard-h">
            <div className={card.head}>
              <h2 id="guard-h">Guardrails</h2>
            </div>
            <p className={s.guardLine}>
              Safety rules run before the AI. It never gives doses or diagnoses.
            </p>
            <More label="All 5 rules">
              <ul className={s.guards}>
                {[
                  "Emergency rules run before the AI",
                  "Never gives drug doses or changes medicines",
                  "Says what data is consistent with, never a diagnosis",
                  "Says when it's unsure or data is old",
                  "Prototype, not a medical device",
                ].map((g) => (
                  <li key={g}>
                    <Check size={16} color="var(--ink-2)" />
                    {g}
                  </li>
                ))}
              </ul>
            </More>
          </section>
        </div>
      </div>
    </div>
  );
}
