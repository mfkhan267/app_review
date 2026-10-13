import { useRef, useState } from "react";
import { techLabel } from "../aggregations.js";
import { LAYER, LAYERS, STATUS, STATUS_ORDER } from "../constants.js";
import { fmtDate } from "../lib/dates.js";
import { HatchBar } from "./ui.jsx";
import Icon from "./Icon.jsx";

const sev = (s) => STATUS_ORDER.indexOf(s);

export default function EstateMap({ components, stats, alignment, onOpenApp, onGoRemediation }) {
  const box = useRef(null);
  const [tip, setTip] = useState(null);
  const total = components.length;
  const planPct = stats.atRisk ? Math.round((stats.withPlan / stats.atRisk) * 100) : 100;

  const showTip = (e, c) => {
    const r = e.currentTarget.getBoundingClientRect();
    const b = box.current.getBoundingClientRect();
    setTip({ c, left: r.left - b.left + r.width / 2, top: r.top - b.top });
  };

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h3>Estate at a Glance</h3>
          <p className="card-sub">Every technology instance, one dot each. Hover for detail, click to open the application.</p>
        </div>
      </header>

      <div className="estate">
        <div className="estate-left">
          <div className="hero-num">{total}</div>
          <div className="hero-cap">technology instances across {new Set(components.map((c) => c.app_id)).size} applications</div>
          <button type="button" className="cta-btn light" onClick={() => onGoRemediation({ filter: "missing" })}>
            Review at-risk <span className="cta-circle"><Icon name="arrow-right" size={14} /></span>
          </button>
        </div>

        <div className="estate-map" ref={box} onMouseLeave={() => setTip(null)}>
          {LAYERS.map((layer) => {
            const rows = components.filter((c) => c.component_type === layer).sort((a, b) => sev(a.status) - sev(b.status));
            return (
              <div className="estate-band" key={layer}>
                <div className="estate-band-head"><Icon name={LAYER[layer].icon} size={14} />{LAYER[layer].short}<span>{rows.length}</span></div>
                <div className="dots">
                  {rows.map((c) => (
                    <button key={c.id} type="button" className={`dot-btn${c.status === "RED" ? " hatch" : ""}`}
                      style={{ background: STATUS[c.status].color }}
                      aria-label={`${techLabel(c)}, ${c.app_name}, ${STATUS[c.status].label}`}
                      onMouseEnter={(e) => showTip(e, c)} onFocus={(e) => showTip(e, c)} onBlur={() => setTip(null)}
                      onClick={() => onOpenApp(c._appPk)} />
                  ))}
                </div>
              </div>
            );
          })}
          {tip && (
            <div className="dot-tip" style={{ left: tip.left, top: tip.top }}>
              <b>{techLabel(tip.c)}</b>
              <span>{tip.c.app_id} &middot; {tip.c.app_name}</span>
              <span>Support ends {fmtDate(tip.c.supportEnd)} &middot; <em style={{ color: STATUS[tip.c.status].color }}>{STATUS[tip.c.status].label}</em></span>
            </div>
          )}
        </div>

        <div className="estate-stats">
          <div className="mini-stat">
            <b>{stats.withPlan}<small>/{stats.atRisk}</small></b>
            <span>At-risk instances with a plan</span>
            <HatchBar pct={planPct} color="#f5a524" />
          </div>
          <div className="mini-stat">
            <b>{alignment.coveredPct}<small>%</small></b>
            <span>Covered by the Tech Catalog</span>
            <HatchBar pct={alignment.coveredPct} color="#7a68dc" />
          </div>
          <div className="mini-stat">
            <b>{alignment.syncedPct}<small>%</small></b>
            <span>Dates match the catalog</span>
            <HatchBar pct={alignment.syncedPct} color="#2e9d5b" />
          </div>
        </div>
      </div>
    </section>
  );
}
