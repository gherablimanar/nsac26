import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, Microphone, ShieldCheck } from "@phosphor-icons/react";
import card from "../components/Card.module.css";
import { LiquidGlassButton } from "../components/ui/apple-tahoe-liquid-glass-button";
import { driftOn } from "../ui/systems.ts";
import { readingOn } from "../data/crew.ts";
import { buildOverview } from "../ui/overviewData.ts";
import { EMERGENCY_TEXT, EMPTY_QUICK, NOTE_TEXT, SEED_C2, respond, userMsg, type Block, type Message } from "../ui/assistantData.ts";
import s from "./Assistant.module.css";

type Props = { crewId: string; day: number; delay: string | null; urgent: boolean };

const mono = (t: string) => <span className="mono">{t}</span>;

function Emergency({ title, text, delay }: { title: string; text: string; delay: string | null }) {
  const [started, setStarted] = useState(false);
  return (
    <div className={s.emergency} role="alert">
      <h2 className={s.emTitle}>{title}</h2>
      <p className={s.emText}>{text}</p>
      <button type="button" className={s.emBtn} onClick={() => setStarted(true)}>Start emergency protocol</button>
      {started
        ? <p className={s.emNote}>Protocol started. Report sent; it reaches Houston {delay ? <>in {mono(delay)}</> : "right away"}.</p>
        : <p className={s.emNote}>A report goes to Houston now.</p>}
    </div>
  );
}

function NoteRow({ delay }: { delay: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.noteRow}>
      <div className={s.noteLine}>
        <span>Note drafted for your flight surgeon. Arrives in {mono(delay ?? "moments")}.</span>
        <LiquidGlassButton asChild interactive material="clear">
          <button type="button" className={s.glassBtn} aria-expanded={open} onClick={() => setOpen(!open)}>
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
  const [messages, setMessages] = useState<Message[]>(crewId === "C2" ? SEED_C2 : []);
  const [text, setText] = useState("");
  const area = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => { setMessages(crewId === "C2" ? SEED_C2 : []); }, [crewId]);
  useEffect(() => { if (urgent) input.current?.focus(); }, [urgent]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { const el = area.current; if (el) el.scrollTop = el.scrollHeight; }, [messages]);

  const send = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setMessages((m) => [...m, userMsg(t)]);
    setText("");
    timers.current.push(window.setTimeout(() => setMessages((m) => [...m, respond(t)]), 400));
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); }
  };

  const fluid = drift.fluid_intake_ml, urine = drift.urine_color_1to8, sodium = drift.sodium_mg;
  const today = readingOn(crewId, day); // shown values = today's reading, like Overview and Health
  const litres = (v: number) => (v / 1000).toFixed(2);
  const fluidText = fluid && today ? `${litres(today.fluid_intake_ml)} L` : "";
  const fluidBand = fluid ? `(your normal ${litres(fluid.bandLo)}-${litres(fluid.bandHi)} L)` : "";
  const urineText = urine && today ? `${today.urine_color_1to8} of 8` : "";
  const urineBand = urine ? `(your normal up to ${Math.round(urine.bandHi)})` : "";
  const sodiumText = sodium && today ? `${today.sodium_mg.toLocaleString("en-US")} mg` : "";
  const sodiumBand = sodium && sodium.status !== "inside band" ? "(above your normal)" : "";

  const renderBlock = (b: Block, i: number): ReactNode => {
    switch (b.kind) {
      case "text": return <p key={i} className={s.p}>{b.text}</p>;
      case "check": return <div key={i} className={s.check}><ShieldCheck size={20} color="var(--ink-2)" /><span>{b.text}</span></div>;
      case "evidence": return (
        <ul key={i} className={s.evidence}>
          <li>Fluid intake today: {mono(fluidText)} {fluidBand}</li>
          <li>Urine colour: {mono(urineText)} {urineBand}</li>
          <li>Sodium: {mono(sodiumText)} {sodiumBand}</li>
        </ul>
      );
      case "action": return <p key={i} className={`${s.p} ${s.action}`}>{b.text}</p>;
      case "escalation": return (
        <p key={i} className={s.escalation}>
          If the pain becomes severe, or you see blood in your urine, use Urgent help. {delay ? <>Houston hears you in {mono(delay)}.</> : "Houston hears you right away."}
        </p>
      );
      case "quick": return (
        <div key={i} className={s.quick}>
          {b.options.map((o) => <button key={o} type="button" className={s.quickBtn} onClick={() => send(o)}>{o}</button>)}
        </div>
      );
      case "note": return <NoteRow key={i} delay={delay} />;
      case "emergency": return <Emergency key={i} title={b.title} text={b.text} delay={delay} />;
    }
  };

  const rowVal = (out: boolean) => (out ? `mono ${s.out}` : "mono");

  return (
    <div>
      <h1 className={s.title}>Assistant</h1>
      <p className={s.sub}>Your AI medical officer. It explains and guides; the safety rules decide. It never gives drug doses.</p>
      <div className={s.grid}>
        <section className={`${card.card} ${s.convo}`} aria-label="Conversation with HALO">
          <div className={s.messages} ref={area}>
            {urgent && <Emergency title="Urgent help" text="Tell me what's happening, or start the emergency protocol now." delay={delay} />}
            {messages.length === 0 && (
              <div className={s.halo}>
                <div className={s.label}>HALO</div>
                <p className={s.p}>Ask about how you feel. HALO checks emergency signs first, then your readings.</p>
                <div className={s.quick}>
                  {EMPTY_QUICK.map((o) => <button key={o} type="button" className={s.quickBtn} onClick={() => send(o)}>{o}</button>)}
                </div>
              </div>
            )}
            {messages.map((m) => m.from === "user" ? (
              <div key={m.id} className={s.user}>{m.text}</div>
            ) : (
              <div key={m.id} className={s.halo}>
                <div className={s.label}>HALO</div>
                {m.blocks.map(renderBlock)}
              </div>
            ))}
          </div>
          <div className={s.composer}>
            <label htmlFor="assistant-input" className={s.vh}>Describe how you feel</label>
            <textarea id="assistant-input" ref={input} className={s.input} rows={1} placeholder="Describe how you feel"
              value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} />
            <button type="button" className={s.mic} aria-label="Speak"><Microphone size={20} /></button>
            <button type="button" className={s.cta} onClick={() => send(text)}>Send</button>
          </div>
        </section>

        <div className={s.context}>
          <section className={card.card} aria-labelledby="using-h">
            <div className={card.head}><h2 id="using-h">What HALO is using</h2></div>
            <dl className={s.rows}>
              <div><dt>Mission day</dt><dd>Day {mono(String(day))}, Mars transit</dd></div>
              <div><dt>Houston delay</dt><dd>{delay ? <>{mono(delay)} one way</> : "Live"}</dd></div>
              <div><dt>Linked risk</dt><dd>{risk ? `${risk.title}, Watch since Day ${risk.sinceDay}` : "None right now"}</dd></div>
              {fluid && <div><dt>Fluid intake</dt><dd className={rowVal(fluid.status !== "inside band")}>{fluidText}</dd></div>}
              {urine && <div><dt>Urine colour</dt><dd className={rowVal(urine.status !== "inside band")}>{urineText}</dd></div>}
              {sodium && <div><dt>Sodium</dt><dd className={rowVal(sodium.status !== "inside band")}>{sodiumText}</dd></div>}
            </dl>
          </section>
          <section className={card.card} aria-labelledby="guard-h">
            <div className={card.head}><h2 id="guard-h">Guardrails</h2></div>
            <ul className={s.guards}>
              {["Emergency rules run before the AI", "Never gives drug doses or changes medicines", "Says what data is consistent with, never a diagnosis", "Says when it's unsure or data is old", "Prototype, not a medical device"].map((g) => (
                <li key={g}><Check size={16} color="var(--ink-2)" />{g}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
