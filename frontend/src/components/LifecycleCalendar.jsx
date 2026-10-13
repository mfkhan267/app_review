import { useId, useMemo, useRef, useState } from "react";
import { lifecycleByQuarter } from "../aggregations.js";
import { LAYER, LAYERS } from "../constants.js";
import { useSize } from "../hooks.js";
import { niceScale } from "../lib/geometry.js";

const M = { t: 22, r: 8, b: 34, l: 30 };

export default function LifecycleCalendar({ components, today }) {
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const wrap = useRef(null);
  const { width, height } = useSize(wrap);
  const H = Math.max(260, height);
  const [hover, setHover] = useState(null);
  const buckets = useMemo(() => lifecycleByQuarter(components, today), [components, today]);
  const scale = niceScale(Math.max(1, ...buckets.map((b) => b.total)), 4, true);

  const innerW = Math.max(0, width - M.l - M.r);
  const innerH = H - M.t - M.b;
  const band = innerW / buckets.length;
  const barW = Math.max(14, Math.min(34, band * 0.56));
  const y = (v) => M.t + innerH - (v / scale.max) * innerH;
  const hb = hover != null ? buckets[hover] : null;

  return (
    <section className="card fill">
      <header className="card-head">
        <div>
          <h3>Lifecycle Calendar</h3>
          <p className="card-sub">When instances reach End of Support, by quarter</p>
        </div>
      </header>
      <div className="legend-chips">
        {LAYERS.map((l) => <span key={l} className="legend-chip"><span className="dot" style={{ background: LAYER[l].color }} />{LAYER[l].label}</span>)}
      </div>
      <div className="chart-wrap grow" ref={wrap}>
        {width > M.l + M.r + 80 && (
          <svg width={width} height={H} role="img" aria-label={`Instances reaching end of support per quarter: ${buckets.map((b) => `${b.label} ${b.total}`).join(", ")}`}>
            {scale.ticks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="4 5" />
                <text x={M.l - 8} y={y(t) + 4} textAnchor="end" className="axis-text">{t}</text>
              </g>
            ))}
            {buckets.map((b, i) => {
              const cx = M.l + band * i + band / 2;
              const bx = cx - barW / 2;
              let acc = 0;
              const dim = hover != null && hover !== i;
              return (
                <g key={b.key} opacity={dim ? 0.4 : 1} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="bar-group">
                  <clipPath id={`${gid}-c${i}`}><rect x={bx} y={M.t} width={barW} height={innerH} rx={barW / 2.4} /></clipPath>
                  <rect x={bx} y={M.t} width={barW} height={innerH} rx={barW / 2.4} fill="var(--track)" />
                  <g clipPath={`url(#${gid}-c${i})`}>
                    {LAYERS.map((l) => {
                      const v = b.counts[l] || 0;
                      if (!v) return null;
                      const h = (v / scale.max) * innerH;
                      const top = M.t + innerH - (acc / scale.max) * innerH - h;
                      acc += v;
                      return <rect key={l} x={bx} y={top} width={barW} height={h} fill={LAYER[l].color} stroke="#fff" strokeWidth="1.5" />;
                    })}
                  </g>
                  {b.total > 0 && <text x={cx} y={y(b.total) - 7} textAnchor="middle" className="bar-num">{b.total}</text>}
                  <text x={cx} y={H - 10} textAnchor="middle" className={`axis-text${b.past ? " axis-red" : ""}`}>{b.label}</text>
                  <rect x={M.l + band * i} y={M.t - 14} width={band} height={innerH + 40} fill="transparent" />
                </g>
              );
            })}
          </svg>
        )}
        {hb && (
          <div className="chart-tip" style={{ left: Math.min(Math.max(8, M.l + band * hover + band / 2 - 100), Math.max(8, width - 208)), top: 4, width: 200 }}>
            <div className="tip-title">{hb.past ? "Already past End of Support" : hb.key === "later" ? "Later than 2 years" : hb.label}</div>
            {LAYERS.map((l) => (
              <div className="tip-row" key={l}><span><span className="dot" style={{ background: LAYER[l].color }} />{LAYER[l].label}</span><b>{hb.counts[l]}</b></div>
            ))}
            {hb.names.length > 0 && (
              <div className="tip-note">{hb.names.slice(0, 3).map((nm, k) => <em key={k}>{nm}</em>)}{hb.names.length > 3 && <em>+{hb.names.length - 3} more</em>}</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
