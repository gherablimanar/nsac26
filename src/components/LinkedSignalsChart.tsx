import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { LinkedSeries } from "../ui/viewTypes.ts";
import s from "./LinkedSignalsChart.module.css";

// The HALO moment: linked signals stacked on one shared day axis, so you see them move together.
// Teal/white band = the astronaut's own normal (from the engine). Amber = outside it in the harmful direction.

type TickProps = { x?: number; y?: number; payload?: { value: number } };

export function LinkedSignalsChart({ series, eventDay, eventLabel, today }: { series: LinkedSeries[]; eventDay: number; eventLabel: string; today: number }) {
  const first = series[0]?.points[0]?.day ?? today - 14;

  const DayTick = ({ x = 0, y = 0, payload }: TickProps) => {
    const d = payload?.value ?? 0;
    const major = d === eventDay || d === today;
    const label = d === first ? `Day ${d}` : d === eventDay ? `Day ${d} ${eventLabel}` : d === today ? "Today" : "";
    const anchor = d === first ? "start" : d === today ? "end" : "middle";
    return (
      <g transform={`translate(${x},${y})`}>
        <line y1={2} y2={major ? 16 : 9} className={major ? s.tickMajor : s.tick} />
        {label && <text y={28} textAnchor={anchor} className={s.axis}>{label}</text>}
      </g>
    );
  };

  return (
    <div className={s.wrap} role="img" aria-label={series.map((x) => `${x.label} ${x.now} ${x.unit}${x.outNow ? ", outside your normal" : ""}`).join(". ")}>
      {series.map((x, i) => {
        const last = i === series.length - 1;
        const vals = x.points.flatMap((p) => [p.value, ...p.band]);
        const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.12;
        return (
          <div key={x.key} className={s.row}>
            <div className={s.label}>
              <span>{x.label}</span>
              <b className={`mono ${x.outNow ? s.bad : ""}`}>{x.now}<small>{x.unit}</small></b>
            </div>
            <div className={s.plot} style={{ height: last ? 92 : 52 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={x.points} syncId="linked" margin={{ top: 2, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="day" type="number" domain={["dataMin", "dataMax"]} ticks={x.points.map((p) => p.day)}
                    hide={!last} axisLine={false} tickLine={false} tick={<DayTick />} height={40} interval={0} />
                  <YAxis hide domain={[lo - pad, hi + pad]} />
                  <Area dataKey="band" stroke="none" fill="var(--band)" isAnimationActive={false} />
                  <ReferenceLine x={eventDay} stroke="var(--ink)" strokeOpacity={0.25} />
                  <Line dataKey="value" stroke="var(--line-in)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
                  <Line dataKey="out" stroke="var(--line-out)" strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
