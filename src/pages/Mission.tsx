import { useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Segmented } from "../components/Segmented";
import { More } from "../components/More";
import { PageHero } from "../components/PageHero";
import { LiquidGlassButton } from "../components/ui/apple-tahoe-liquid-glass-button";
import card from "../components/Card.module.css";
import { MISSION_PROFILE, historyOf, readingOn } from "../data/crew";
import { driftOn } from "../ui/systems";
import { GATE_OF, OUTBOX, PROFILES, worstGate, type Gate } from "../ui/missionData";
import type { MissionProfile } from "../engine/types.ts";
import s from "./Mission.module.css";

type Props = { crewId: string; day: number };

const gateClass = (g: Gate) => (g === "Caution" ? s.caution : g === "No-go" ? s.nogo : "");

export function Mission({ crewId, day }: Props) {
  const [profile, setProfile] = useState<MissionProfile>(MISSION_PROFILE);
  const [sent, setSent] = useState("");
  const [outboxOpen, setOutboxOpen] = useState(false);
  const p = PROFILES.find((x) => x.id === profile) ?? PROFILES[0];

  const drift = driftOn(crewId, day);
  const today = readingOn(crewId, day);
  const history = historyOf(crewId);
  const storm = !!today?.in_storm_shelter;

  const sleep = drift.sleep_hours, react = drift.reaction_time_ms, rad = drift.radiation_mSv_today;
  const inputs = [
    { key: "sleep", label: "Sleep last night", d: sleep, unit: "h", dec: 1, gate: sleep ? GATE_OF[sleep.status] : "Go" as Gate, phrase: "lower than" },
    { key: "react", label: "Reaction time", d: react, unit: "ms", dec: 0, gate: react ? GATE_OF[react.status] : "Go" as Gate, phrase: "slower than" },
    { key: "rad", label: "Radiation today", d: rad, unit: "mSv", dec: 2, gate: storm ? "No-go" as Gate : rad ? GATE_OF[rad.status] : "Go" as Gate, phrase: "higher than" },
  ];
  const overall = worstGate(inputs.map((i) => i.gate));
  const bad = inputs.filter((i) => i.gate !== "Go");
  const fine = inputs.filter((i) => i.gate === "Go").map((i) => i.label.split(" ")[0].toLowerCase().replace("reaction", "reaction time"));
  const lowerCase = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const reason = bad.length === 0
    ? "" // the three Go rows already say it
    : `${bad.map((i) => (i.key === "rad" && storm ? "Radiation is high because of the solar storm" : `${i.label.replace(" last night", "").replace(" today", "")} is ${i.phrase} your normal`)).join("; ")}${fine.length ? `; ${lowerCase(fine.join(" and "))} ${fine.length > 1 ? "are" : "is"} fine` : ""}.`;

  const eva = history.find((r) => r.eva_scheduled && r.day >= day);
  const until = eva ? eva.day - day : 0;
  const evaLine = eva
    ? `Spacewalk on Day ${eva.day}, ${until === 0 ? "today" : `in ${until} ${until === 1 ? "day" : "days"}`}`
    : "No spacewalk scheduled in the next 30 days";

  const reactionOpen = react && GATE_OF[react.status] !== "Go";
  const primary = reactionOpen ? "Take reaction test" : "Send readiness to Houston";
  const confirm = reactionOpen ? "Reaction test opens in Daily Log" : `Sent. It reaches Houston in ${p.delay === "Live link" ? "seconds" : p.delay}`;

  const series = history.filter((r) => r.day <= day && r.day > day - 30).map((r) => ({ day: r.day, mSv: r.radiation_mSv_today }));
  const stormInRange = series.some((r) => r.day === 40);
  const ticks = [0, 1, 2, 3].map((i) => series[Math.round(((series.length - 1) * i) / 3)]?.day).filter((d): d is number => d !== undefined);

  return (
    <>
      <PageHero page="Mission" state={overall === "Go" ? "normal" : overall === "No-go" ? "act" : "watch"}
        title={eva ? `${overall === "Go" ? "Go" : overall === "No-go" ? "No-go" : "Go with caution"} for your spacewalk` : `Readiness today: ${overall}`}
        line={`${evaLine}.${reason ? ` ${reason}` : ""}`}
        aside={<Segmented label="Mission profile" value={profile} onChange={setProfile} options={PROFILES.map((x) => ({ id: x.id, label: x.label }))} />} />

      <div key={profile} className={s.grid}>
        <section className={`${card.card} ${s.hero}`} aria-labelledby="gate-h">
          <div className={card.head}><h2 id="gate-h">{eva ? "Spacewalk readiness" : "Readiness today"}</h2></div>
          <table className={s.inputs}>
            <thead className={s.srOnly}><tr><th>Signal</th><th>Value</th><th>Your normal</th><th>Status</th></tr></thead>
            <tbody>
              {inputs.map((i) => (
                <tr key={i.key}>
                  <th scope="row">{i.label}</th>
                  <td><span className="mono">{i.d ? i.d.value.toFixed(i.dec) : "n/a"}</span> <span className={s.unit}>{i.unit}</span></td>
                  <td className={s.normal}>{i.d ? <>Your normal <span className="mono">{i.d.bandLo.toFixed(i.dec)} to {i.d.bandHi.toFixed(i.dec)}</span></> : ""}</td>
                  <td className={`${s.gateWord} ${gateClass(i.gate)}`}>{i.gate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={s.act}>
            <button type="button" className={s.cta} onClick={() => setSent(confirm)}>{primary}</button>
            <span className={s.confirm} role="status">{sent}</span>
          </div>
          {overall !== "Go" && <p className={s.note}>{p.escalation}</p>}
          <More label="How readiness is decided">
            <p>The worst of sleep, reaction time and radiation decides. Thresholds are demo parameters.</p>
            {overall === "Go" && <p>{p.escalation}</p>}
          </More>
        </section>

        <section className={`${card.card} ${s.link}`} aria-labelledby="link-h">
          <div className={card.head}><h2 id="link-h">Earth link</h2></div>
          {p.delay === "Live link"
            ? <p className={s.big}>Live link to Houston</p>
            : <><p className={s.lead}>Houston hears you in</p><p className={`${s.big} mono`}>{p.delay}</p></>}
          {p.roundTrip && <p className={s.roundTrip}>Round trip <span className="mono">{p.roundTrip}</span></p>}
          <h3 className={s.sub2}>Outbox</h3>
          <p className={s.item}>{OUTBOX.title}</p>
          <p className={s.itemMeta}>Queued <span className="mono">{OUTBOX.queued}</span>, arrives <span className="mono">{OUTBOX.arrives}</span></p>
          <LiquidGlassButton asChild interactive material="clear">
            <button type="button" className={s.glassBtn} aria-expanded={outboxOpen} onClick={() => setOutboxOpen((o) => !o)}>
              {outboxOpen ? "Close outbox" : "Open outbox"}
            </button>
          </LiquidGlassButton>
          {outboxOpen && <p className={s.preview}>{OUTBOX.note}</p>}
        </section>

        <section className={`${card.card} ${s.rad}`} aria-labelledby="rad-h">
          <div className={card.head}><h2 id="rad-h">Radiation</h2></div>
          <div className={s.radBody}>
            <div className={s.radFacts}>
              <div>
                <p className={s.label}>Today</p>
                <p className={s.value}><span className="mono">{today?.radiation_mSv_today.toFixed(2) ?? "n/a"}</span> <span className={s.unit}>mSv</span></p>
              </div>
              <div>
                <p className={s.label}>Mission total</p>
                <p className={s.value2}><span className="mono">{today ? Math.round(today.radiation_mSv_total) : "n/a"}</span> <span className={s.unit}>mSv</span></p>
              </div>
              <p className={s.ref}>{p.dose}</p>
              <p className={storm ? s.stormOn : s.stormOff}>{storm ? "Solar storm: stay in the shielded shelter" : "No solar storm alert"}</p>
            </div>
            <div className={s.chart} role="img" aria-label="Radiation per day over the last 30 days">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={series} margin={{ top: 18, right: 12, bottom: 0, left: 12 }}>
                  <XAxis dataKey="day" type="number" domain={["dataMin", "dataMax"]} ticks={ticks} tickFormatter={(d) => `Day ${d}`}
                    axisLine={false} tickLine={false} tick={{ fontFamily: "var(--mono)", fontSize: 12, fill: "#555C6B" }} />
                  <YAxis hide domain={["auto", "auto"]} />
                  {stormInRange && <ReferenceLine x={40} stroke="#555C6B" strokeOpacity={0.4}
                    label={{ value: "Solar storm, Day 40", position: "top", fontSize: 12, fill: "#555C6B" }} />}
                  <Line dataKey="mSv" stroke="#555C6B" strokeWidth={1.75} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
