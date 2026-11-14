import { useEffect, useMemo, useState } from "react";
import { Check, PaperPlaneTilt, Warning } from "@phosphor-icons/react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import card from "../components/Card.module.css";
import { More } from "../components/More";
import { PageHero } from "../components/PageHero";
import { MISSION_PROFILE, historyOf, readingOn } from "../data/crew";
import { evaluateRisks } from "../engine/risks.ts";
import type { Level } from "../engine/types.ts";
import {
  CATEGORIES, HORIZON_DAY, MEDS, MED_BY_ID, PACKED_DAYS_BEFORE_LAUNCH, STOCK,
  adherence, belowDay, clockNow, lastSetDay, nextDose, pastState, runsOutDay, scheduleOf, statusOf, strengthCurve, strengthOf, untilText,
  type Category, type MedDay, type MedInfo, type TodayStatus,
} from "../ui/medicinesData";
import s from "./Medicines.module.css";

type Props = { crewId: string; day: number; delay: string | null; today: MedDay; onChange: (d: MedDay) => void };

const RANK: Record<Level, number> = { Nominal: 0, Watch: 1, Act: 2 };
const SKIP_REASONS = ["Felt unwell", "Forgot until too late", "Ran out", "Flight surgeon said to"];
const NOTE_STARTERS = ["I need more of a medicine", "I think I have a side effect", "I have a question about my schedule"];
const HISTORY_DAYS = 14;

type Supply = "Fine" | "Use first" | "Below 80%" | "Runs out";
const SUPPLY_ORDER: Supply[] = ["Below 80%", "Runs out", "Use first", "Fine"];

/** Onboard medicines, today's doses, adherence and notes to the flight surgeon. HALO never changes a dose. */
export function Medicines({ crewId, day, delay, today, onChange }: Props) {
  const [now, setNow] = useState(clockNow);
  useEffect(() => {
    const t = setInterval(() => setNow(clockNow()), 30_000);
    return () => clearInterval(t);
  }, []);

  const doses = scheduleOf(crewId);
  const risks = useMemo(() => evaluateRisks(historyOf(crewId), day, MISSION_PROFILE), [crewId, day]);
  const levelOf = (ruleId: string): Level => risks.find((r) => r.ruleId === ruleId)?.level ?? "Nominal";
  const cautionsOf = (m: MedInfo) => (m.cautions ?? []).filter((c) => RANK[levelOf(c.ruleId)] >= RANK[c.from]);

  const next = nextDose(crewId, today, now);
  const total = readingOn(crewId, day)?.radiation_mSv_total ?? 0;
  const stowed = day + PACKED_DAYS_BEFORE_LAUNCH;

  const take = (id: string) => onChange({ ...today, taken: { ...today.taken, [id]: clockNow() } });
  const undo = (id: string) => {
    const taken = { ...today.taken };
    const skipped = { ...today.skipped };
    delete taken[id];
    delete skipped[id];
    onChange({ ...today, taken, skipped });
  };
  const skip = (id: string, reason: string) => onChange({ ...today, skipped: { ...today.skipped, [id]: reason } });
  const logExtra = (medId: string) => onChange({ ...today, extra: [...today.extra, { medId, time: clockNow() }] });
  const queueNote = (text: string) => onChange({ ...today, notes: [...today.notes, { text, time: clockNow() }] });

  // Hero: the one thing to do on this page right now. Several overdue doses are handled together.
  const overdue = doses.filter((d) => statusOf(d, today, now) === "Overdue");
  const anyOverdue = overdue.length > 0;
  const nextName = next ? MED_BY_ID[next.dose.medId].name : "";
  const title = !next
    ? "Today's doses are done"
    : overdue.length > 1 ? `${overdue.length} doses are overdue`
    : next.status === "Overdue" ? `${nextName} was due at ${next.dose.time}`
    : next.status === "Due now" ? `${nextName} is due now`
    : `Next: ${nextName} at ${next.dose.time}`;
  const line = !next
    ? `All ${doses.length} scheduled ${doses.length === 1 ? "dose is" : "doses are"} recorded for Day ${day}.`
    : overdue.length > 1
      ? `${overdue.map((d) => `${MED_BY_ID[d.medId].name} at ${d.time}`).join(", ")}. Schedule set by your flight surgeon; HALO never changes doses.`
      : [`${next.dose.how}.`, next.status === "Later" ? `Due ${untilText(next.dose.time, now)}.` : "", "Schedule set by your flight surgeon; HALO never changes doses."].filter(Boolean).join(" ");
  const takeAllOverdue = () => {
    const t = clockNow();
    onChange({ ...today, taken: { ...today.taken, ...Object.fromEntries(overdue.map((d) => [d.id, t])) } });
  };

  return (
    <>
      <PageHero page="Medicines" state={anyOverdue ? "watch" : "normal"} title={title} line={line}
        aside={<span className={s.clock}>Ship time <span className="mono">{now}</span></span>}>
        {overdue.length > 1
          ? <button type="button" className={s.cta} onClick={takeAllOverdue}><Check size={18} weight="bold" />Mark all {overdue.length} as taken</button>
          : next && <button type="button" className={s.cta} onClick={() => take(next.dose.id)}><Check size={18} weight="bold" />Mark {nextName} as taken</button>}
      </PageHero>

      <div className={s.grid}>
        <TodayCard crewId={crewId} day={day} now={now} today={today} onTake={take} onUndo={undo} onSkip={skip}
          onExtra={logExtra} cautionsOf={cautionsOf} />
        <HistoryCard crewId={crewId} day={day} today={today} now={now} />
        <PharmacyCard crewId={crewId} day={day} total={total} stowed={stowed} cautionsOf={cautionsOf} />
        <NoteCard delay={delay} notes={today.notes} today={today} onQueue={queueNote} />
      </div>
    </>
  );
}

// ---- Today -----------------------------------------------------------------------------------------

type TodayProps = {
  crewId: string; day: number; now: string; today: MedDay;
  onTake: (id: string) => void; onUndo: (id: string) => void; onSkip: (id: string, reason: string) => void;
  onExtra: (medId: string) => void; cautionsOf: (m: MedInfo) => { text: string }[];
};

function TodayCard({ crewId, day, now, today, onTake, onUndo, onSkip, onExtra, cautionsOf }: TodayProps) {
  const [skipping, setSkipping] = useState<string | null>(null);
  const [asNeeded, setAsNeeded] = useState<string | null>(null);
  const doses = scheduleOf(crewId);
  const done = doses.filter((d) => today.taken[d.id] || today.skipped[d.id]).length;
  const prn = MEDS.filter((m) => m.prnPerWeek);
  const picked = asNeeded ? MED_BY_ID[asNeeded] : null;
  const pickedCautions = picked ? cautionsOf(picked) : [];

  return (
    <section className={card.card} aria-labelledby="today-h">
      <div className={card.head}><h2 id="today-h">Today, Day {day}</h2><span>{done} of {doses.length} done</span></div>
      <ul className={s.list}>
        {doses.map((d) => {
          const m = MED_BY_ID[d.medId];
          const st: TodayStatus = statusOf(d, today, now);
          const closed = st === "Taken" || st === "Skipped";
          return (
            <li key={d.id} className={`${s.dose} ${closed ? s.closed : ""}`}>
              <span className={`mono ${s.time}`}>{d.time}</span>
              <span className={s.what}>
                <b>{m.name}</b>
                <span>{d.how}</span>
                {d.setOnDay > 1 && d.setOnDay >= day - 7 && <span className={s.newTag}>New on Day {d.setOnDay}</span>}
              </span>
              <span className={s.right}>
                <StatusPill st={st} detail={st === "Taken" ? today.taken[d.id] : st === "Skipped" ? today.skipped[d.id] : undefined} />
                {closed
                  ? <button type="button" className={s.link} onClick={() => onUndo(d.id)}>Undo</button>
                  : (
                    <span className={s.btns}>
                      <button type="button" className={s.take} onClick={() => onTake(d.id)}>Take</button>
                      <button type="button" className={s.link} aria-expanded={skipping === d.id} onClick={() => setSkipping(skipping === d.id ? null : d.id)}>Skip</button>
                    </span>
                  )}
              </span>
              {skipping === d.id && !closed && (
                <div className={s.reasons} role="group" aria-label={`Why are you skipping ${m.name}?`}>
                  <span>Why?</span>
                  {SKIP_REASONS.map((r) => (
                    <button key={r} type="button" className={s.chip} onClick={() => { onSkip(d.id, r); setSkipping(null); }}>{r}</button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={s.prn}>
        <h3>Took something as needed?</h3>
        <div className={s.chips}>
          {prn.map((m) => (
            <button key={m.id} type="button" className={`${s.chip} ${asNeeded === m.id ? s.chipOn : ""}`} aria-pressed={asNeeded === m.id}
              onClick={() => setAsNeeded(asNeeded === m.id ? null : m.id)}>
              {m.name}{cautionsOf(m).length > 0 && <Warning size={14} weight="bold" className={s.chipWarn} aria-label="has a caution today" />}
            </button>
          ))}
        </div>
        {picked && (
          <div className={s.prnPick}>
            <p><b>{picked.name}</b>: {picked.purpose.toLowerCase()}.{picked.note ? ` ${picked.note}` : ""}</p>
            {pickedCautions.map((c) => <p key={c.text} className={s.caution}><Warning size={16} weight="bold" />{c.text}</p>)}
            <button type="button" className={s.take} onClick={() => { onExtra(picked.id); setAsNeeded(null); }}>Log one dose now</button>
          </div>
        )}
        {today.extra.length > 0 && (
          <ul className={s.extras}>
            {today.extra.map((x, i) => <li key={i}><span className="mono">{x.time}</span> {MED_BY_ID[x.medId].name}, as needed</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatusPill({ st, detail }: { st: TodayStatus; detail?: string }) {
  const cls = st === "Overdue" ? s.pillWarn : st === "Due now" ? s.pillDue : st === "Taken" ? s.pillDone : s.pillQuiet;
  return (
    <span className={`${s.pill} ${cls}`}>
      {st === "Taken" && <Check size={13} weight="bold" />}
      <span>{st}{detail && (st === "Taken" ? <> <span className="mono">{detail}</span></> : `: ${detail.toLowerCase()}`)}</span>
    </span>
  );
}

// ---- Last 14 days ----------------------------------------------------------------------------------

function HistoryCard({ crewId, day, today, now }: { crewId: string; day: number; today: MedDay; now: string }) {
  const doses = scheduleOf(crewId);
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => day - HISTORY_DAYS + 1 + i);
  const pct = adherence(crewId, doses, day, 30);
  // One row per medicine; a medicine taken twice a day shows the worse of its two doses
  const meds = [...new Set(doses.map((d) => d.medId))];
  const cell = (medId: string, d: number) => {
    const mine = doses.filter((x) => x.medId === medId);
    if (d === day) {
      const st = mine.map((x) => statusOf(x, today, now));
      if (st.every((x) => x === "Taken")) return "taken";
      if (st.some((x) => x === "Skipped")) return "skipped";
      if (st.some((x) => x === "Overdue")) return "missed";
      return "pending";
    }
    const st = mine.map((x) => pastState(crewId, x, d));
    if (st.every((x) => x === "none")) return "none";
    return st.includes("missed") ? "missed" : "taken";
  };
  const LABEL: Record<string, string> = { taken: "taken", missed: "missed", skipped: "skipped", pending: "not taken yet", none: "not on schedule yet" };

  return (
    <section className={card.card} aria-labelledby="hist-h">
      <div className={card.head}>
        <h2 id="hist-h">Last {HISTORY_DAYS} days</h2>
        {pct !== null && <span><span className={`mono ${pct < 90 ? s.warnText : ""}`}>{pct}%</span> taken over 30 days</span>}
      </div>
      <div className={s.weeks}>
        {meds.map((id) => {
          const m = MED_BY_ID[id];
          const states = days.map((d) => cell(id, d));
          const n = states.filter((x) => x === "taken").length;
          const due = states.filter((x) => x !== "none" && x !== "pending").length;
          return (
            <div key={id}>
              <div className={s.weekHead}><b>{m.name}</b><span>{n} of {due}</span></div>
              <div className={s.squares}>
                {states.map((st, i) => (
                  <span key={days[i]} className={`${s.sq} ${s[st]}`} role="img" title={`Day ${days[i]}: ${LABEL[st]}`} aria-label={`Day ${days[i]}, ${LABEL[st]}`} />
                ))}
              </div>
            </div>
          );
        })}
        <div className={s.axis}><span className="mono">D{days[0]}</span><span className="mono">Today</span></div>
        <div className={s.legend} aria-hidden="true">
          <span><i className={`${s.sq} ${s.taken}`} />Taken</span>
          <span><i className={`${s.sq} ${s.missed}`} />Missed</span>
          <span><i className={`${s.sq} ${s.pending}`} />Not yet</span>
        </div>
      </div>
      <p className={s.small}>Schedule last changed on Day {lastSetDay(crewId)}.</p>
    </section>
  );
}

// ---- Onboard pharmacy -------------------------------------------------------------------------------

type PharmProps = { crewId: string; day: number; total: number; stowed: number; cautionsOf: (m: MedInfo) => { text: string }[] };

function PharmacyCard({ crewId, day, total, stowed, cautionsOf }: PharmProps) {
  const [cat, setCat] = useState<Category | "All">("All");
  const [open, setOpen] = useState<string | null>(null);
  const doses = scheduleOf(crewId);
  const stock = STOCK[crewId] ?? STOCK.C1;

  const rows = MEDS.map((m) => {
    const strength = strengthOf(m.k, m.r, stowed, total);
    const drop = belowDay(m.k, m.r, day, total);
    const perDay = doses.filter((d) => d.medId === m.id).length || (m.prnPerWeek ?? 0) / 7;
    const left = stock[m.id] ?? 0;
    const out = runsOutDay(left, perDay, day);
    // No resupply on a Mars transit: flag anything dropping below 90% within about 6 months
    const supply: Supply = strength < 80 ? "Below 80%"
      : out !== null && out - day < 180 ? "Runs out"
      : strength < 90 || (drop !== null && drop - day < 180) ? "Use first" : "Fine";
    return { m, strength, drop, left, out, supply, cautions: cautionsOf(m) };
  })
    .filter((r) => r.left > 0)
    .sort((a, b) => SUPPLY_ORDER.indexOf(a.supply) - SUPPLY_ORDER.indexOf(b.supply) || a.m.name.localeCompare(b.m.name));

  const shown = cat === "All" ? rows : rows.filter((r) => r.m.category === cat);
  const flagged = rows.filter((r) => r.supply !== "Fine").length;
  const cats = CATEGORIES.filter((c) => rows.some((r) => r.m.category === c));

  return (
    <section className={`${card.card} ${s.pharm}`} aria-labelledby="ph-h">
      <div className={card.head}>
        <h2 id="ph-h">Your onboard kit</h2>
        <span>{flagged ? `${flagged} of ${rows.length} need a plan` : `All ${rows.length} fine`}</span>
      </div>
      <div className={s.filters} role="group" aria-label="Filter by type">
        {(["All", ...cats] as const).map((c) => (
          <button key={c} type="button" className={`${s.chip} ${cat === c ? s.chipOn : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <table className={s.table}>
        <thead>
          <tr><th>Medicine</th><th>Left</th><th>Strength now</th><th>Below 90% around</th><th>Status</th></tr>
        </thead>
        <tbody>
          {shown.map((r) => {
            const isOpen = open === r.m.id;
            return [
              <tr key={r.m.id} className={`${s.rowBtn} ${isOpen ? s.rowOpen : ""}`} onClick={() => setOpen(isOpen ? null : r.m.id)}>
                <th scope="row">
                  <button type="button" className={s.nameBtn} aria-expanded={isOpen} aria-controls={`med-${r.m.id}`}
                    onClick={(e) => { e.stopPropagation(); setOpen(isOpen ? null : r.m.id); }}>
                    {r.m.name}
                    {r.cautions.length > 0 && <Warning size={14} weight="bold" className={s.chipWarn} aria-label="has a caution today" />}
                  </button>
                  <span className={s.sub}>{r.m.category} · {r.m.location}</span>
                </th>
                <td>
                  <span className="mono">{r.left}</span>
                  <span className={s.sub}>{r.out === null ? "Lasts the mission" : <>Until Day <span className="mono">{r.out}</span></>}</span>
                </td>
                <td>
                  <span className={s.bar} aria-hidden="true"><i style={{ width: `${r.strength}%` }} className={r.strength < 90 ? s.barWarn : ""} /></span>
                  <span className="mono">{r.strength}%</span>
                </td>
                <td>{r.drop === null ? "Lasts the round trip" : <span className="mono">Day {r.drop}</span>}</td>
                <td>
                  <span className={r.supply === "Fine" ? s.fine : s.warn}>{r.supply}</span>
                  {r.cautions.length > 0 && <span className={`${s.sub} ${s.warn}`}>Ask before using</span>}
                </td>
              </tr>,
              isOpen && (
                <tr key={`${r.m.id}-d`} id={`med-${r.m.id}`} className={s.detailRow}>
                  <td colSpan={5}><MedDetail r={r} day={day} total={total} /></td>
                </tr>
              ),
            ];
          })}
        </tbody>
      </table>

      <More label="How strength and supply are estimated">
        <p>Every medicine has been stowed <span className="mono">{stowed}</span> days and absorbed <span className="mono">{Math.round(total)}</span> mSv. Strength drops with time and radiation.</p>
        <p>Demo model shaped by Du et al. 2011: after 880 days in orbit only 31% of medicines passed potency tests, against 54% on Earth. Not a lab measurement. Future dose assumes 1.8 mSv per day in Mars cruise.</p>
        <p>Supply counts your scheduled doses per day; as-needed medicines use a rough weekly estimate. There is no resupply on a Mars transit, so anything running out within about 6 months is flagged.</p>
      </More>
    </section>
  );
}

type Row = { m: MedInfo; strength: number; drop: number | null; left: number; out: number | null; supply: Supply; cautions: { text: string }[] };

function MedDetail({ r, day, total }: { r: Row; day: number; total: number }) {
  const data = useMemo(() => strengthCurve(r.m.k, r.m.r, day, total), [r.m, day, total]);
  const lo = Math.min(80, Math.floor((Math.min(...data.map((d) => d.strength)) - 5) / 10) * 10);
  const plan = r.supply === "Runs out" ? `Supply runs out around Day ${r.out}. Ask your flight surgeon how to plan for the rest of the mission.`
    : r.supply === "Below 80%" ? "Weaker than it should be. Ask your flight surgeon before relying on it."
    : r.supply === "Use first" ? "Losing strength sooner than the rest. Use these packs before newer ones."
    : "Nothing to do.";
  return (
    <div className={s.detail}>
      <div className={s.detailText}>
        <p><b>{r.m.purpose}.</b>{r.m.note ? ` ${r.m.note}` : ""}</p>
        {r.cautions.map((c) => <p key={c.text} className={s.caution}><Warning size={16} weight="bold" />{c.text}</p>)}
        <p className={r.supply === "Fine" ? s.small : s.warnText}>{plan}</p>
        <p className={s.small}>Stored in {r.m.location}.</p>
      </div>
      <div className={s.chart} role="img" aria-label={`Estimated strength of ${r.m.name} from Day ${day} to Day ${HORIZON_DAY}`}>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <XAxis dataKey="day" type="number" domain={[day, HORIZON_DAY]} ticks={[day, 300, 600, HORIZON_DAY]} tickFormatter={(d) => `D${d}`}
              tick={{ fontSize: 11, fill: "var(--ink-2)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[lo, 100]} ticks={[...new Set([lo, 80, 90, 100])].filter((v) => v >= lo)} tick={{ fontSize: 11, fill: "var(--ink-2)" }} axisLine={false} tickLine={false} unit="%" />
            <ReferenceLine y={90} stroke="var(--watch-mark)" strokeDasharray="4 4" />
            {r.out !== null && <ReferenceLine x={r.out} stroke="var(--act)" strokeDasharray="4 4" label={{ value: `Runs out D${r.out}`, fontSize: 11, fill: "var(--act)", position: r.out > 600 ? "insideBottomRight" : "insideBottomLeft" }} />}
            <Tooltip formatter={(v) => [`${v}%`, "Strength"]} labelFormatter={(d) => `Day ${d}`} />
            <Line type="monotone" dataKey="strength" stroke="var(--ink)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- Note to the flight surgeon ------------------------------------------------------------------------

function NoteCard({ delay, notes, today, onQueue }: { delay: string | null; notes: MedDay["notes"]; today: MedDay; onQueue: (t: string) => void }) {
  const [text, setText] = useState("");
  // Skips and as-needed doses go into the note automatically, so the flight surgeon sees the whole day
  const auto = [
    ...Object.entries(today.skipped).map(([id, why]) => `Skipped ${MED_BY_ID[id.split("-")[0]]?.name ?? id} (${why.toLowerCase()})`),
    ...today.extra.map((x) => `Took ${MED_BY_ID[x.medId].name} as needed at ${x.time}`),
  ];
  return (
    <section className={`${card.card} ${s.note}`} aria-labelledby="note-h">
      <div className={card.head}><h2 id="note-h">Ask your flight surgeon</h2>{delay && <span>Reaches Houston in <span className="mono">{delay}</span></span>}</div>
      <div className={s.chips}>
        {NOTE_STARTERS.map((n) => <button key={n} type="button" className={s.chip} onClick={() => setText(n + ": ")}>{n}</button>)}
      </div>
      <label htmlFor="med-note" className={s.visuallyHidden}>Message to your flight surgeon</label>
      <textarea id="med-note" className={s.textarea} rows={3} value={text} placeholder="Write a question or request" onChange={(e) => setText(e.target.value)} />
      {auto.length > 0 && <p className={s.small}>Also included: {auto.join("; ")}.</p>}
      <button type="button" className={s.take} disabled={!text.trim()} onClick={() => { onQueue(text.trim()); setText(""); }}>
        <PaperPlaneTilt size={16} weight="bold" />Queue for flight surgeon
      </button>
      {notes.length > 0 && (
        <ul className={s.sent}>
          {notes.map((n, i) => <li key={i}><span className="mono">{n.time}</span> Queued: {n.text}</li>)}
        </ul>
      )}
    </section>
  );
}
