import { useId, useMemo, useRef, useState } from "react";
import { exposureForecast, techLabel } from "../aggregations.js";
import { useSize } from "../hooks.js";
import { fmtMonthYear, fmtMonthShort } from "../lib/dates.js";
import { monotonePath, niceScale } from "../lib/geometry.js";
import { Segmented } from "./ui.jsx";

const M = { t: 16, r: 20, b: 30, l: 42 };
const H = 280;
const RED = "#e5484d", BLUE = "#3b6cf6";

export default function ExposureForecast({ components, today }) {
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const wrap = useRef(null);
  const { width } = useSize(wrap);
  const [mode, setMode] = useState("count");
  const [hoverIdx, setHoverIdx] = useState(null);

  const points = useMemo(() => exposureForecast(components, today, 24), [components, today]);
  const total = components.length || 1;
  const val = (v) => (mode === "pct" ? (v / total) * 100 : v);
  const fmt = (v) => (mode === "pct" ? `${Math.round(val(v))}%` : String(v));
  const scale = niceScale(Math.max(1, ...points.map((p) => val(p.noAction))), 4, mode !== "pct");

  const innerW = Math.max(0, width - M.l - M.r);
  const innerH = H - M.t - M.b;
  const n = points.length;
  const x = (i) => M.l + (i / (n - 1)) * innerW;
  const y = (v) => M.t + innerH - (v / scale.max) * innerH;
  const noPath = monotonePath(points.map((p) => ({ x: x(p.i), y: y(val(p.noAction)) })));
  const plPath = monotonePath(points.map((p) => ({ x: x(p.i), y: y(val(p.withPlans)) })));
  const area = `${noPath} L ${x(n - 1)} ${M.t + innerH} L ${x(0)} ${M.t + innerH} Z`;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - M.l) / innerW) * (n - 1));
    setHoverIdx(Math.max(0, Math.min(n - 1, i)));
  };
  const hp = hoverIdx != null ? points[hoverIdx] : null;
  const tipLeft = hp ? (x(hp.i) > width * 0.55 ? x(hp.i) - 232 : x(hp.i) + 16) : 0;

  const now = points[0], y1 = points[12], y2 = points[24];
  const delta = (a, b) => { const d = b - a; return d === 0 ? "no change" : `${d > 0 ? "+" : ""}${d}`; };

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h3>Exposure Forecast</h3>
          <p className="card-sub">Unsupported instances over the next 24 months, with and without submitted upgrade plans</p>
        </div>
        <Segmented label="Display" value={mode} onChange={setMode}
          options={[{ value: "count", label: "Instances" }, { value: "pct", label: "% of estate" }]} />
      </header>

      <div className="legend-chips">
        <span className="legend-chip"><span className="dot" style={{ background: RED }} />No action</span>
        <span className="legend-chip"><span className="dot" style={{ background: BLUE }} />With submitted plans</span>
      </div>

      <div className="chart-wrap" ref={wrap} style={{ height: H }}>
        {width > M.l + M.r + 80 && (
          <svg width={width} height={H} onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)} role="img"
            aria-label={`Unsupported instances today ${now.noAction}; in 12 months ${y1.noAction} with no action and ${y1.withPlans} with plans; in 24 months ${y2.noAction} with no action and ${y2.withPlans} with plans.`}>
            <defs>
              <linearGradient id={`${gid}-a`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={RED} stopOpacity="0.20" />
                <stop offset="100%" stopColor={RED} stopOpacity="0" />
              </linearGradient>
            </defs>
            {scale.ticks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="4 5" />
                <text x={M.l - 10} y={y(t) + 4} textAnchor="end" className="axis-text">{mode === "pct" ? `${t}%` : t}</text>
              </g>
            ))}
            {points.map((p) => (p.i % 3 === 0 ? (
              <text key={p.i} x={x(p.i)} y={H - 8} textAnchor="middle" className="axis-text">{p.i === 0 ? "Now" : fmtMonthShort(p.date)}</text>
            ) : null))}
            <path d={area} fill={`url(#${gid}-a)`} />
            <path d={noPath} fill="none" stroke={RED} strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
            <path d={plPath} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
            {hp && (
              <g>
                <line x1={x(hp.i)} x2={x(hp.i)} y1={M.t} y2={M.t + innerH} stroke="var(--ink-2)" strokeDasharray="4 4" opacity="0.5" />
                <circle cx={x(hp.i)} cy={y(val(hp.noAction))} r="6" fill="#fff" stroke={RED} strokeWidth="3" />
                <circle cx={x(hp.i)} cy={y(val(hp.withPlans))} r="5" fill="#fff" stroke={BLUE} strokeWidth="3" />
              </g>
            )}
          </svg>
        )}
        {hp && (
          <div className="chart-tip" style={{ left: tipLeft, top: 10, width: 216 }}>
            <div className="tip-title">{hp.i === 0 ? "Today" : fmtMonthYear(hp.date)}</div>
            <div className="tip-row"><span><span className="dot" style={{ background: RED }} />No action</span><b>{fmt(hp.noAction)}</b></div>
            <div className="tip-row"><span><span className="dot" style={{ background: BLUE }} />With plans</span><b>{fmt(hp.withPlans)}</b></div>
            {hp.newly.length > 0 && (
              <div className="tip-note">
                <span>Newly unsupported</span>
                {hp.newly.slice(0, 3).map((c) => <em key={c.id}>{techLabel(c)}</em>)}
                {hp.newly.length > 3 && <em>+{hp.newly.length - 3} more</em>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="stat-trio">
        <div><span className="stat-cap">Unsupported today</span><b>{fmt(now.noAction)}</b></div>
        <div><span className="stat-cap">In 12 months</span><b>{fmt(y1.noAction)}<small className="neg">{delta(now.noAction, y1.noAction)}</small></b>
          <span className="stat-sub">{fmt(y1.withPlans)} with plans</span></div>
        <div><span className="stat-cap">In 24 months</span><b>{fmt(y2.noAction)}<small className="neg">{delta(now.noAction, y2.noAction)}</small></b>
          <span className="stat-sub">{fmt(y2.withPlans)} with plans</span></div>
      </div>
      <p className="fine-print">Assumes each submitted plan completes on its target date. Plans already past their target date are not credited.</p>
    </section>
  );
}
