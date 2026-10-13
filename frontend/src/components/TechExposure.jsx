import { LAYER, STATUS } from "../constants.js";
import { HatchBar, StatusPill } from "./ui.jsx";
import Icon from "./Icon.jsx";

export default function TechExposure({ items, onOpen }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h3>Technology Exposure</h3>
          <p className="card-sub">Most widely deployed technology and version combinations</p>
        </div>
      </header>
      <ol className="exposure">
        {items.map((t, i) => (
          <li key={t.key}>
            <button type="button" className="exposure-row" onClick={() => onOpen(t)} aria-label={`${t.name}: ${t.count} instances. Open ${LAYER[t.type].label}.`}>
              <span className="exposure-rank">{i + 1}</span>
              <span className="exposure-main">
                <span className="exposure-name"><Icon name={LAYER[t.type].icon} size={14} />{t.name}</span>
                <HatchBar pct={(t.count / max) * 100} color={STATUS[t.worst].color} delay={i * 60} />
                <span className="exposure-sub">{t.count} instance{t.count === 1 ? "" : "s"} &middot; {t.appCount} app{t.appCount === 1 ? "" : "s"}</span>
              </span>
              <StatusPill status={t.worst} compact />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
