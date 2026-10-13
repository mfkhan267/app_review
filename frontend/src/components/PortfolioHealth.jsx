import { useState } from "react";
import { STATUS, STATUS_ORDER } from "../constants.js";
import { arcPath, polar, ringSegments } from "../lib/geometry.js";
import { pct } from "../lib/format.js";
import { HatchBar, Segmented } from "./ui.jsx";

const SIZE = 280, C = SIZE / 2, R = 92, STROKE = 22;

function Ring({ counts, total, hover, onHover, onSelect, mode }) {
  const segs = ringSegments(STATUS_ORDER.map((k) => ({ key: k, value: counts[k] || 0 })), { r: R, stroke: STROKE, gapDeg: 9 });
  const activeKey = hover ?? segs[0]?.key ?? null;
  const active = segs.find((s) => s.key === activeKey);
  let pillStyle = null;
  if (active) {
    const p = polar(C, C, R + STROKE / 2 + 26, active.midDeg);
    pillStyle = { left: `${(p.x / SIZE) * 100}%`, top: `${(p.y / SIZE) * 100}%` };
  }
  const summary = STATUS_ORDER.map((k) => `${counts[k] || 0} ${STATUS[k].label}`).join(", ");

  return (
    <div className="ring-box">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Status of ${total} technology instances: ${summary}`}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--track)" strokeWidth={STROKE} />
        {segs.map((s) => {
          const isActive = s.key === activeKey;
          const dim = hover && !isActive;
          const common = {
            fill: "none", stroke: STATUS[s.key].color, strokeWidth: STROKE + (isActive && hover ? 4 : 0),
            strokeLinecap: "round", opacity: dim ? 0.3 : 1, className: "ring-seg",
            onMouseEnter: () => onHover(s.key), onMouseLeave: () => onHover(null), onClick: () => onSelect(s.key),
          };
          return s.full
            ? <circle key={s.key} cx={C} cy={C} r={R} {...common} />
            : <path key={s.key} d={arcPath(C, C, R, s.startDeg, s.endDeg)} {...common} />;
        })}
      </svg>
      <div className="ring-center">
        <div className="ring-total">{total}</div>
        <div className="ring-caption">instances</div>
      </div>
      {active && (
        <div className="ring-pill" style={pillStyle}>
          <span className="dot" style={{ background: STATUS[active.key].color }} />
          {mode === "pct" ? `${Math.round(active.pct * 100)}%` : `${active.value} (${Math.round(active.pct * 100)}%)`}
        </div>
      )}
    </div>
  );
}

export default function PortfolioHealth({ counts, total, onOpenStatus }) {
  const [mode, setMode] = useState("count");
  const [hover, setHover] = useState(null);

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h3>Portfolio Health</h3>
          <p className="card-sub">Technology instances by lifecycle status</p>
        </div>
        <Segmented label="Display" value={mode} onChange={setMode}
          options={[{ value: "count", label: "\u03A3", title: "Show counts" }, { value: "pct", label: "%", title: "Show percentages" }]} />
      </header>

      <Ring counts={counts} total={total} hover={hover} onHover={setHover} onSelect={onOpenStatus} mode={mode} />

      <div className="status-rows">
        {STATUS_ORDER.map((k, i) => {
          const n = counts[k] || 0;
          return (
            <button key={k} type="button" className={`status-row${hover === k ? " hot" : ""}`}
              onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(k)} onBlur={() => setHover(null)} onClick={() => onOpenStatus(k)}>
              <span className="status-row-top">
                <span className="status-row-name"><span className="dot" style={{ background: STATUS[k].color }} />{STATUS[k].label}
                  <small>{STATUS[k].short}</small></span>
                <span className="status-row-val">{mode === "pct" ? `${pct(n, total)}%` : `${n}/${total}`}</span>
              </span>
              <HatchBar pct={pct(n, total)} color={STATUS[k].color} delay={i * 70} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
