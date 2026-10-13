import { STATUS, STATUS_ORDER, LAYER } from "../constants.js";
import Icon from "./Icon.jsx";

export default function LayerHealth({ layers, totalSupportedPct, onOpenLayer }) {
  const maxTotal = Math.max(1, ...layers.map((l) => l.total));
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h3>Layer Health</h3>
          <p className="card-sub">Status mix per technology layer</p>
        </div>
      </header>
      <div className="layer-grid">
        <div className="layer-hero">
          <div className="hero-num">{totalSupportedPct}<small>%</small></div>
          <div className="hero-cap">of instances are still supported</div>
          <div className="mini-legend">
            {STATUS_ORDER.map((k) => <span key={k}><span className="dot" style={{ background: STATUS[k].color }} />{STATUS[k].label}</span>)}
          </div>
          <div className="hatch-note"><span className="hatch-swatch" />Hatched = past End of Support</div>
        </div>
        <div className="pillars">
          {layers.map((l) => {
            const h = Math.max(84, Math.round((l.total / maxTotal) * 200));
            return (
              <button key={l.layer} type="button" className="pillar" onClick={() => onOpenLayer(l.layer)}
                aria-label={`${LAYER[l.layer].label}: ${l.total} instances, ${l.supportedPct ?? 0}% supported. Open.`}>
                <span className="pillar-count">{l.total}</span>
                <span className="pillar-body" style={{ height: h }}>
                  {STATUS_ORDER.map((k) => (l.counts[k] ? (
                    <span key={k} className={`pillar-seg${k === "RED" ? " hatch" : ""}`}
                      style={{ flexGrow: l.counts[k], background: STATUS[k].color }} title={`${l.counts[k]} ${STATUS[k].label}`}>
                      {l.counts[k]}
                    </span>
                  ) : null))}
                </span>
                <span className="pillar-label"><Icon name={LAYER[l.layer].icon} size={15} />{LAYER[l.layer].short}</span>
                <span className="pillar-sub">{l.supportedPct == null ? "\u2014" : `${l.supportedPct}% supported`}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
