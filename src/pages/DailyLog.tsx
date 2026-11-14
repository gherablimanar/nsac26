import { useMemo, useState } from "react";
import { LiquidGlassButton } from "../components/ui/apple-tahoe-liquid-glass-button";
import { readingOn } from "../data/crew.ts";
import { driftOn } from "../ui/systems.ts";
import { fmtNum, fmtRange } from "../ui/healthData.ts";
import { SYMPTOMS, URINE_COLOURS, VISION_OVERDUE } from "../ui/logData.ts";
import card from "../components/Card.module.css";
import { PageHero } from "../components/PageHero";
import s from "./DailyLog.module.css";

type Props = { crewId: string; day: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));
const FIVE = [1, 2, 3, 4, 5];

function Scale({ name, legend, value, onChange }: { name: string; legend: string; value: number; onChange: (n: number) => void }) {
  return (
    <fieldset className={s.field}>
      <legend>{legend}</legend>
      <div className={s.scale} role="radiogroup" aria-label={legend}>
        {FIVE.map((n) => (
          <label key={n} className={s.sq}>
            <input type="radio" name={name} checked={value === n} onChange={() => onChange(n)} />
            <span>{n}</span>
          </label>
        ))}
      </div>
      <div className={s.ends}><span>Low</span><span>High</span></div>
    </fieldset>
  );
}

export function DailyLog({ crewId, day }: Props) {
  const today = readingOn(crewId, day);
  const drift = useMemo(() => driftOn(crewId, day), [crewId, day]);

  const [fluid, setFluid] = useState<number[]>(() => [today?.fluid_intake_ml ?? 0]);
  const [urine, setUrine] = useState(() => clamp(today?.urine_color_1to8 ?? 3, 1, 8));
  const [mood, setMood] = useState(() => clamp(today?.mood_1to5 ?? 3, 1, 5));
  const [stress, setStress] = useState(() => clamp(today?.stress_1to5 ?? 3, 1, 5));
  const [sleep, setSleep] = useState(() => (today?.sleep_hours ?? 7).toFixed(2).replace(/0$/, ""));
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [started, setStarted] = useState<string | null>(null);

  const total = fluid.reduce((a, b) => a + b, 0);
  const fd = drift.fluid_intake_ml;
  const short = fd ? Math.max(0, fd.bandLo - total) : 0;
  const rd = drift.reaction_time_ms;
  const toggle = (name: string) => setSymptoms((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]));
  const dirty = () => setSaved(false);

  const startNote = (id: string) => started === id && <p className={s.note} role="status">Opens the test. Coming in the next build.</p>;

  return (
    <>
      <PageHero page="Daily Log" state={short > 0 ? "watch" : "normal"}
        title={short > 0 ? `Drink ${(short / 1000).toFixed(1)} L more today` : "Your fluid is inside your normal today"}
        line={`Day ${day} check-in. Takes about 2 minutes.`} />
      <div className={s.grid}>
        <section className={`${card.card} ${s.checkin}`} aria-label="Check-in">
          <fieldset className={s.field}>
            <legend>Fluid today</legend>
            <div className={`mono ${s.big}`}>{(total / 1000).toFixed(2)} L</div>
            <div className={s.row}>
              <button type="button" className={s.outline} onClick={() => { setFluid([...fluid, 250]); dirty(); }}>+250 ml</button>
              <button type="button" className={s.outline} onClick={() => { setFluid([...fluid, 500]); dirty(); }}>+500 ml</button>
              <button type="button" className={s.text} disabled={fluid.length <= 1} onClick={() => { setFluid(fluid.slice(0, -1)); dirty(); }}>Undo</button>
            </div>
            {fd && <p className={s.hint}>Your normal {fmtRange("fluid_intake_ml", fd.bandLo, fd.bandHi)}</p>}
          </fieldset>

          <fieldset className={s.field}>
            <legend>Urine colour</legend>
            <div className={s.swatches} role="radiogroup" aria-label="Urine colour">
              {URINE_COLOURS.map((c, i) => (
                <label key={c} className={s.swatch}>
                  <input type="radio" name="urine" aria-label={`Urine colour ${i + 1} of 8`} checked={urine === i + 1} onChange={() => { setUrine(i + 1); dirty(); }} />
                  <span style={{ background: c }} />
                </label>
              ))}
            </div>
            <div className={`${s.ends} ${s.swatchEnds}`}><span>Pale</span><span>Dark</span></div>
            {urine >= 5 && <p className={s.amber}>Darker than your normal. Drink more and check again tonight.</p>}
          </fieldset>

          <Scale name="mood" legend="Mood" value={mood} onChange={(n) => { setMood(n); dirty(); }} />
          <Scale name="stress" legend="Stress" value={stress} onChange={(n) => { setStress(n); dirty(); }} />

          <div className={s.field}>
            <label htmlFor="sleep" className={s.legend}>Sleep last night, hours</label>
            <input id="sleep" type="number" inputMode="decimal" className={`mono ${s.num}`} step={0.25} min={0} max={14} value={sleep}
              onChange={(e) => { setSleep(e.target.value); dirty(); }} />
          </div>

          <fieldset className={s.field}>
            <legend>Symptoms</legend>
            <div className={s.row}>
              {SYMPTOMS.map((n) => (
                <label key={n} className={s.chip}>
                  <input type="checkbox" checked={symptoms.includes(n)} onChange={() => { toggle(n); dirty(); }} />
                  <span>{n}</span>
                </label>
              ))}
            </div>
            {symptoms.includes("Blurred vision") && <p className={s.amber}>Tell your crew medical officer today and do the vision self-test.</p>}
          </fieldset>

          <div className={s.save}>
            <button type="button" className={s.cta} onClick={() => setSaved(true)}>Save check-in</button>
            {saved && <span className={s.saved} role="status">Saved for Day {day}</span>}
          </div>
        </section>

        <section className={`${card.card} ${s.tests}`} aria-labelledby="tests-title">
          <h2 id="tests-title" className={s.testsTitle}>Tests</h2>

          <div className={s.test}>
            <div className={s.testTop}>
              <div><b>Reaction test</b> <span className={s.dur}>3 min</span></div>
              <button type="button" className={s.text} onClick={() => setStarted("reaction")}>Start</button>
            </div>
            {today && <p className={s.result}><span className={`mono ${rd?.status !== "inside band" ? s.amberText : ""}`}>{fmtNum("reaction_time_ms", today.reaction_time_ms)} ms</span> today</p>}
            {rd && <p className={s.hint}>Your normal {fmtRange("reaction_time_ms", rd.bandLo, rd.bandHi)}</p>}
            {startNote("reaction")}
          </div>

          <div className={s.test}>
            <div className={s.testTop}>
              <div><b>Memory task</b> <span className={s.dur}>2 min</span></div>
              <button type="button" className={s.text} onClick={() => setStarted("memory")}>Start</button>
            </div>
            {today && <p className={s.result}><span className="mono">{fmtNum("memory_score", today.memory_score)} of 100</span> today</p>}
            {startNote("memory")}
          </div>

          <div className={s.test}>
            <div className={s.testTop}>
              <div><b>Vision self-test</b> <span className={s.dur}>Weekly</span></div>
              <LiquidGlassButton asChild interactive material="clear">
                <button type="button" className={s.glassBtn} onClick={() => setStarted("vision")}>Start</button>
              </LiquidGlassButton>
            </div>
            <p className={`${s.result} ${s.amberText}`}>{VISION_OVERDUE}</p>
            {startNote("vision")}
          </div>
        </section>
      </div>
    </>
  );
}
