import { useEffect, useMemo, useState } from "react";
import { Check, PaperPlaneTilt, Warning } from "@phosphor-icons/react";
import card from "../components/Card.module.css";
import { More } from "../components/More";
import { PageHero } from "../components/PageHero";
import { MISSION_PROFILE, historyOf, readingOn } from "../data/crew";
import { evaluateRisks } from "../engine/risks.ts";
import type { Level } from "../engine/types.ts";
import {
  MEDS,
  MED_BY_ID,
  PACKED_DAYS_BEFORE_LAUNCH,
  STOCK,
  adherence,
  clockNow,
  lastSetDay,
  nextDose,
  pastState,
  scheduleOf,
  statusOf,
  untilText,
  type MedDay,
  type MedInfo,
  type TodayStatus,
} from "../ui/medicinesData";
import s from "./Medicines.module.css";

type Props = {
  crewId: string;
  day: number;
  delay: string | null;
  today: MedDay;
  onChange: (d: MedDay) => void;
};

const RANK: Record<Level, number> = { Nominal: 0, Watch: 1, Act: 2 };
const SKIP_REASONS = [
  "Felt unwell",
  "Forgot until too late",
  "Ran out",
  "Flight surgeon said to",
];
const NOTE_STARTERS = [
  "I need more of a medicine",
  "I think I have a side effect",
  "I have a question about my schedule",
];
const HISTORY_DAYS = 14;

/** Onboard medicines, today's doses, adherence and notes to the flight surgeon. HALO never changes a dose. */
export function Medicines({ crewId, day, delay, today, onChange }: Props) {
  const [now, setNow] = useState(clockNow);
  useEffect(() => {
    const t = setInterval(() => setNow(clockNow()), 30_000);
    return () => clearInterval(t);
  }, []);

  const doses = scheduleOf(crewId);
  const risks = useMemo(
    () => evaluateRisks(historyOf(crewId), day, MISSION_PROFILE),
    [crewId, day],
  );
  const levelOf = (ruleId: string): Level =>
    risks.find((r) => r.ruleId === ruleId)?.level ?? "Nominal";
  const cautionsOf = (m: MedInfo) =>
    (m.cautions ?? []).filter((c) => RANK[levelOf(c.ruleId)] >= RANK[c.from]);

  const next = nextDose(crewId, today, now);
  const total = readingOn(crewId, day)?.radiation_mSv_total ?? 0;
  const stowed = day + PACKED_DAYS_BEFORE_LAUNCH;

  const take = (id: string) =>
    onChange({ ...today, taken: { ...today.taken, [id]: clockNow() } });
  const undo = (id: string) => {
    const taken = { ...today.taken };
    const skipped = { ...today.skipped };
    delete taken[id];
    delete skipped[id];
    onChange({ ...today, taken, skipped });
  };
  const skip = (id: string, reason: string) =>
    onChange({ ...today, skipped: { ...today.skipped, [id]: reason } });
  const logExtra = (medId: string) =>
    onChange({
      ...today,
      extra: [...today.extra, { medId, time: clockNow() }],
    });
  const queueNote = (text: string) =>
    onChange({ ...today, notes: [...today.notes, { text, time: clockNow() }] });

  // Hero: the one thing to do on this page right now. Several overdue doses are handled together.
  const overdue = doses.filter((d) => statusOf(d, today, now) === "Overdue");
  const anyOverdue = overdue.length > 0;
  const nextName = next ? MED_BY_ID[next.dose.medId].name : "";
  const title = !next
    ? "Today's doses are done"
    : overdue.length > 1
      ? `${overdue.length} doses are overdue`
      : next.status === "Overdue"
        ? `${nextName} was due at ${next.dose.time}`
        : next.status === "Due now"
          ? `${nextName} is due now`
          : `Next: ${nextName} at ${next.dose.time}`;
  const line = !next
    ? `All ${doses.length} scheduled ${doses.length === 1 ? "dose is" : "doses are"} recorded for Day ${day}.`
    : overdue.length > 1
      ? `${overdue.map((d) => `${MED_BY_ID[d.medId].name} at ${d.time}`).join(", ")}. Fictional demonstration schedule; HALO never changes doses.`
      : [
          `${next.dose.how}.`,
          next.status === "Later"
            ? `Due ${untilText(next.dose.time, now)}.`
            : "",
          "Fictional demonstration schedule; HALO never changes doses.",
        ]
          .filter(Boolean)
          .join(" ");
  const takeAllOverdue = () => {
    const t = clockNow();
    onChange({
      ...today,
      taken: {
        ...today.taken,
        ...Object.fromEntries(overdue.map((d) => [d.id, t])),
      },
    });
  };

  return (
    <>
      <PageHero
        page="Medicines"
        state={anyOverdue ? "watch" : "normal"}
        title={title}
        line={
          line +
          " Fictional demonstration schedule; no clinician approval is verified by HALO."
        }
        aside={
          <span className={s.clock}>
            Ship time <span className="mono">{now}</span>
          </span>
        }
      >
        {overdue.length > 1 ? (
          <button type="button" className={s.cta} onClick={takeAllOverdue}>
            <Check size={18} weight="bold" />
            Mark all {overdue.length} as taken
          </button>
        ) : (
          next && (
            <button
              type="button"
              className={s.cta}
              onClick={() => take(next.dose.id)}
            >
              <Check size={18} weight="bold" />
              Mark {nextName} as taken
            </button>
          )
        )}
      </PageHero>

      <div className={s.grid}>
        <TodayCard
          crewId={crewId}
          day={day}
          now={now}
          today={today}
          onTake={take}
          onUndo={undo}
          onSkip={skip}
          onExtra={logExtra}
          cautionsOf={cautionsOf}
        />
        <HistoryCard crewId={crewId} day={day} today={today} now={now} />
        <PharmacyCard
          crewId={crewId}
          day={day}
          total={total}
          stowed={stowed}
          cautionsOf={cautionsOf}
        />
        <NoteCard
          delay={delay}
          notes={today.notes}
          today={today}
          onQueue={queueNote}
        />
      </div>
    </>
  );
}

// ---- Today -----------------------------------------------------------------------------------------

type TodayProps = {
  crewId: string;
  day: number;
  now: string;
  today: MedDay;
  onTake: (id: string) => void;
  onUndo: (id: string) => void;
  onSkip: (id: string, reason: string) => void;
  onExtra: (medId: string) => void;
  cautionsOf: (m: MedInfo) => { text: string }[];
};

function TodayCard({
  crewId,
  day,
  now,
  today,
  onTake,
  onUndo,
  onSkip,
  onExtra,
  cautionsOf,
}: TodayProps) {
  const [skipping, setSkipping] = useState<string | null>(null);
  const [asNeeded, setAsNeeded] = useState<string | null>(null);
  const doses = scheduleOf(crewId);
  const done = doses.filter(
    (d) => today.taken[d.id] || today.skipped[d.id],
  ).length;
  const prn = MEDS.filter((m) => m.prnPerWeek);
  const picked = asNeeded ? MED_BY_ID[asNeeded] : null;
  const pickedCautions = picked ? cautionsOf(picked) : [];

  return (
    <section className={card.card} aria-labelledby="today-h">
      <div className={card.head}>
        <h2 id="today-h">Today, Day {day}</h2>
        <span>
          {done} of {doses.length} done
        </span>
      </div>
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
                {d.setOnDay > 1 && d.setOnDay >= day - 7 && (
                  <span className={s.newTag}>New on Day {d.setOnDay}</span>
                )}
              </span>
              <span className={s.right}>
                <StatusPill
                  st={st}
                  detail={
                    st === "Taken"
                      ? today.taken[d.id]
                      : st === "Skipped"
                        ? today.skipped[d.id]
                        : undefined
                  }
                />
                {closed ? (
                  <button
                    type="button"
                    className={s.link}
                    onClick={() => onUndo(d.id)}
                  >
                    Undo
                  </button>
                ) : (
                  <span className={s.btns}>
                    <button
                      type="button"
                      className={s.take}
                      onClick={() => onTake(d.id)}
                    >
                      Take
                    </button>
                    <button
                      type="button"
                      className={s.link}
                      aria-expanded={skipping === d.id}
                      onClick={() =>
                        setSkipping(skipping === d.id ? null : d.id)
                      }
                    >
                      Skip
                    </button>
                  </span>
                )}
              </span>
              {skipping === d.id && !closed && (
                <div
                  className={s.reasons}
                  role="group"
                  aria-label={`Why are you skipping ${m.name}?`}
                >
                  <span>Why?</span>
                  {SKIP_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={s.chip}
                      onClick={() => {
                        onSkip(d.id, r);
                        setSkipping(null);
                      }}
                    >
                      {r}
                    </button>
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
            <button
              key={m.id}
              type="button"
              className={`${s.chip} ${asNeeded === m.id ? s.chipOn : ""}`}
              aria-pressed={asNeeded === m.id}
              onClick={() => setAsNeeded(asNeeded === m.id ? null : m.id)}
            >
              {m.name}
              {cautionsOf(m).length > 0 && (
                <Warning
                  size={14}
                  weight="bold"
                  className={s.chipWarn}
                  aria-label="has a caution today"
                />
              )}
            </button>
          ))}
        </div>
        {picked && (
          <div className={s.prnPick}>
            <p>
              <b>{picked.name}</b>: {picked.purpose.toLowerCase()}.
              {picked.note ? ` ${picked.note}` : ""}
            </p>
            {pickedCautions.map((c) => (
              <p key={c.text} className={s.caution}>
                <Warning size={16} weight="bold" />
                {c.text}
              </p>
            ))}
            <button
              type="button"
              className={s.take}
              onClick={() => {
                onExtra(picked.id);
                setAsNeeded(null);
              }}
            >
              Log one dose now
            </button>
          </div>
        )}
        {today.extra.length > 0 && (
          <ul className={s.extras}>
            {today.extra.map((x, i) => (
              <li key={i}>
                <span className="mono">{x.time}</span> {MED_BY_ID[x.medId].name}
                , as needed
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatusPill({ st, detail }: { st: TodayStatus; detail?: string }) {
  const cls =
    st === "Overdue"
      ? s.pillWarn
      : st === "Due now"
        ? s.pillDue
        : st === "Taken"
          ? s.pillDone
          : s.pillQuiet;
  return (
    <span className={`${s.pill} ${cls}`}>
      {st === "Taken" && <Check size={13} weight="bold" />}
      <span>
        {st}
        {detail &&
          (st === "Taken" ? (
            <>
              {" "}
              <span className="mono">{detail}</span>
            </>
          ) : (
            `: ${detail.toLowerCase()}`
          ))}
      </span>
    </span>
  );
}

// ---- Last 14 days ----------------------------------------------------------------------------------

function HistoryCard({
  crewId,
  day,
  today,
  now,
}: {
  crewId: string;
  day: number;
  today: MedDay;
  now: string;
}) {
  const doses = scheduleOf(crewId);
  const days = Array.from(
    { length: HISTORY_DAYS },
    (_, i) => day - HISTORY_DAYS + 1 + i,
  );
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
  const LABEL: Record<string, string> = {
    taken: "taken",
    missed: "missed",
    skipped: "skipped",
    pending: "not taken yet",
    none: "not on schedule yet",
  };

  return (
    <section className={card.card} aria-labelledby="hist-h">
      <div className={card.head}>
        <h2 id="hist-h">Last {HISTORY_DAYS} days</h2>
        {pct !== null && (
          <span>
            <span className={`mono ${pct < 90 ? s.warnText : ""}`}>{pct}%</span>{" "}
            taken over 30 days
          </span>
        )}
      </div>
      <div className={s.weeks}>
        {meds.map((id) => {
          const m = MED_BY_ID[id];
          const states = days.map((d) => cell(id, d));
          const n = states.filter((x) => x === "taken").length;
          const due = states.filter(
            (x) => x !== "none" && x !== "pending",
          ).length;
          return (
            <div key={id}>
              <div className={s.weekHead}>
                <b>{m.name}</b>
                <span>
                  {n} of {due}
                </span>
              </div>
              <div className={s.squares}>
                {states.map((st, i) => (
                  <span
                    key={days[i]}
                    className={`${s.sq} ${s[st]}`}
                    role="img"
                    title={`Day ${days[i]}: ${LABEL[st]}`}
                    aria-label={`Day ${days[i]}, ${LABEL[st]}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
        <div className={s.axis}>
          <span className="mono">D{days[0]}</span>
          <span className="mono">Today</span>
        </div>
        <div className={s.legend} aria-hidden="true">
          <span>
            <i className={`${s.sq} ${s.taken}`} />
            Taken
          </span>
          <span>
            <i className={`${s.sq} ${s.missed}`} />
            Missed
          </span>
          <span>
            <i className={`${s.sq} ${s.pending}`} />
            Not yet
          </span>
        </div>
      </div>
      <p className={s.small}>
        Schedule last changed on Day {lastSetDay(crewId)}.
      </p>
    </section>
  );
}

// ---- Onboard pharmacy — experimental illustration -------------------------------------------------------------------------------

type PharmProps = {
  crewId: string;
  day: number;
  total: number;
  stowed: number;
  cautionsOf: (m: MedInfo) => { text: string }[];
};

function PharmacyCard({ crewId, cautionsOf }: PharmProps) {
  const stock = STOCK[crewId] ?? STOCK.C1;
  return (
    <section className={`${card.card} ${s.pharm}`} aria-labelledby="ph-h">
      <div className={card.head}>
        <h2 id="ph-h">Your onboard kit</h2>
        <span>Demonstration inventory</span>
      </div>
      <p>
        Potency and expiry cannot be inferred from elapsed days and radiation
        alone. Verify product, batch, storage history and approved stability
        data with the flight surgeon.
      </p>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Simulated stock</th>
            <th>Storage</th>
            <th>Potency</th>
          </tr>
        </thead>
        <tbody>
          {MEDS.filter((m) => (stock[m.id] ?? 0) > 0).map((m) => (
            <tr key={m.id}>
              <th>{m.name}</th>
              <td>{stock[m.id]}</td>
              <td>{m.location}</td>
              <td>
                Unknown — not measured
                {cautionsOf(m).map((c) => (
                  <p key={c.text}>{c.text}</p>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ---- Note to the flight surgeon ------------------------------------------------------------------------

function NoteCard({
  delay,
  notes,
  today,
  onQueue,
}: {
  delay: string | null;
  notes: MedDay["notes"];
  today: MedDay;
  onQueue: (t: string) => void;
}) {
  const [text, setText] = useState("");
  // Skips and as-needed doses go into the note automatically, so the flight surgeon sees the whole day
  const auto = [
    ...Object.entries(today.skipped).map(
      ([id, why]) =>
        `Skipped ${MED_BY_ID[id.split("-")[0]]?.name ?? id} (${why.toLowerCase()})`,
    ),
    ...today.extra.map(
      (x) => `Took ${MED_BY_ID[x.medId].name} as needed at ${x.time}`,
    ),
  ];
  return (
    <section className={`${card.card} ${s.note}`} aria-labelledby="note-h">
      <div className={card.head}>
        <h2 id="note-h">Ask your flight surgeon</h2>
        {delay && (
          <span>
            Scenario delay <span className="mono">{delay}</span>
          </span>
        )}
      </div>
      <div className={s.chips}>
        {NOTE_STARTERS.map((n) => (
          <button
            key={n}
            type="button"
            className={s.chip}
            onClick={() => setText(n + ": ")}
          >
            {n}
          </button>
        ))}
      </div>
      <label htmlFor="med-note" className={s.visuallyHidden}>
        Message to your flight surgeon
      </label>
      <textarea
        id="med-note"
        className={s.textarea}
        rows={3}
        value={text}
        placeholder="Write a question or request"
        onChange={(e) => setText(e.target.value)}
      />
      {auto.length > 0 && (
        <p className={s.small}>Also included: {auto.join("; ")}.</p>
      )}
      <button
        type="button"
        className={s.take}
        disabled={!text.trim()}
        onClick={() => {
          onQueue(text.trim());
          setText("");
        }}
      >
        <PaperPlaneTilt size={16} weight="bold" />
        Save draft for flight surgeon
      </button>
      {notes.length > 0 && (
        <ul className={s.sent}>
          {notes.map((n, i) => (
            <li key={i}>
              <span className="mono">{n.time}</span> Draft, not transmitted:{" "}
              {n.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
