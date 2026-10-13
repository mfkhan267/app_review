import { techLabel } from "../aggregations.js";
import { LAYER, STATUS } from "../constants.js";
import { relativeText } from "../lib/dates.js";
import Icon from "./Icon.jsx";

export function AttentionList({ items, onOpenApp, limit }) {
  return (
    <ul className="attn-list">
      {items.slice(0, limit ?? items.length).map(({ component: c, days, hasPlan, overdue }) => (
        <li key={c.id}>
          <button type="button" className="attn-row" onClick={() => onOpenApp(c._appPk)}>
            <span className="attn-chip" style={{ background: STATUS[c.status].tint, color: STATUS[c.status].ink }}>
              <Icon name={LAYER[c.component_type].icon} size={18} />
            </span>
            <span className="attn-main">
              <strong>{techLabel(c)}</strong>
              <small>{c.app_id} &middot; {c.app_name}</small>
            </span>
            <span className="attn-side">
              <b style={{ color: STATUS[c.status].ink }}>{relativeText(days)}</b>
              {c.status === "RED" || c.status === "AMBER"
                ? <small className={!hasPlan || overdue ? "warn" : ""}>{overdue ? "Plan overdue" : hasPlan ? "Plan submitted" : "No plan"}</small>
                : <small>{c.status === "BLUE" ? "Extended support" : "Supported"}</small>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function AttentionRail({ items, stats, onOpenApp, onGoRemediation, isAdmin }) {
  const allCovered = stats.atRisk > 0 && stats.missing === 0;
  return (
    <>
      <section className="card">
        <header className="card-head">
          <div>
            <h3>Needs Attention</h3>
            <p className="card-sub">Most urgent Red and Amber instances</p>
          </div>
          <button type="button" className="link-btn" onClick={() => onGoRemediation()}>View all</button>
        </header>
        {items.length === 0
          ? <p className="muted-note">Nothing is Red or Amber. The estate is in good shape.</p>
          : <AttentionList items={items} onOpenApp={onOpenApp} limit={6} />}
      </section>

      <section className="cta-card">
        <span className="cta-shape s1" /><span className="cta-shape s2" />
        <div className="cta-eyebrow"><Icon name="flag" size={14} /> Upgrade plans</div>
        {stats.atRisk === 0 ? (
          <h3>No at-risk instances to plan for.</h3>
        ) : allCovered ? (
          <h3>All {stats.atRisk} at-risk instances have an upgrade plan.</h3>
        ) : (
          <h3><span>{stats.missing}</span> of {stats.atRisk} at-risk instances have no upgrade plan.</h3>
        )}
        <p>
          {stats.overdue > 0 ? `${stats.overdue} submitted plan${stats.overdue === 1 ? " is" : "s are"} past its target date. ` : ""}
          {isAdmin ? "Record plans in Remediation before the quarterly review." : "Owners are asked to submit plans before the quarterly review."}
        </p>
        <button type="button" className="cta-btn" onClick={() => onGoRemediation({ filter: stats.missing ? "missing" : "all" })}>
          Review remediation <Icon name="arrow-right" size={16} />
        </button>
      </section>
    </>
  );
}
