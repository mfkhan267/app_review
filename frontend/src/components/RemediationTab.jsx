import { useMemo, useState } from "react";
import { allComponents, ownerGroups, planStats, techLabel } from "../aggregations.js";
import { LAYER, STATUS } from "../constants.js";
import { fmtDate, relativeText } from "../lib/dates.js";
import { mailto, reminderBody } from "../lib/mail.js";
import { pct } from "../lib/format.js";
import { PlanCell } from "./ComponentTable.jsx";
import Icon from "./Icon.jsx";
import { Avatar, EmptyState, FilterChips, HatchBar, PageHeader, StatusPill } from "./ui.jsx";

export default function RemediationTab({ apps, isAdmin, preset, today, onOpenApp, onPlan }) {
  const [filter, setFilter] = useState(preset?.filter || "all");
  const [q, setQ] = useState(preset?.q || "");

  const groups = useMemo(() => ownerGroups(apps, today), [apps, today]);
  const stats = useMemo(() => planStats(allComponents(apps), today), [apps, today]);
  const redN = groups.reduce((n, g) => n + g.items.filter((i) => i.component.status === "RED").length, 0);
  const amberN = stats.atRisk - redN;

  const match = (i) =>
    filter === "all" ||
    (filter === "RED" && i.component.status === "RED") ||
    (filter === "AMBER" && i.component.status === "AMBER") ||
    (filter === "missing" && !i.hasPlan) ||
    (filter === "overdue" && i.overdue);

  const needle = q.trim().toLowerCase();
  const visible = groups
    .map((g) => ({ ...g, shown: g.items.filter(match) }))
    .filter((g) => g.shown.length && (!needle || `${g.owner} ${g.email}`.toLowerCase().includes(needle)));

  return (
    <>
      <PageHeader title="Owner Remediation" subtitle="Red and Amber instances grouped by the application owner responsible for an upgrade plan" />

      <div className="mini-grid">
        <div className="mini-card"><span className="mini-label">Owners with action items</span><b>{groups.length}</b></div>
        <div className="mini-card"><span className="mini-label">At-risk instances</span><b>{stats.atRisk}</b>
          <span className="mini-sub">{redN} Red &middot; {amberN} Amber</span></div>
        <div className="mini-card"><span className="mini-label">Plans submitted</span>
          <b>{stats.withPlan}<small>/{stats.atRisk}</small></b>
          <HatchBar pct={stats.atRisk ? pct(stats.withPlan, stats.atRisk) : 100} color="#f5a524" /></div>
        <div className="mini-card"><span className="mini-label">Plans past target date</span><b className={stats.overdue ? "neg" : ""}>{stats.overdue}</b></div>
      </div>

      <div className="toolbar-card">
        <FilterChips label="Filter instances" value={filter} onChange={setFilter}
          options={[
            { value: "all", label: "All", count: stats.atRisk },
            { value: "RED", label: "Red", count: redN, color: STATUS.RED.color },
            { value: "AMBER", label: "Amber", count: amberN, color: STATUS.AMBER.color },
            { value: "missing", label: "No plan", count: stats.missing },
            { value: "overdue", label: "Overdue plan", count: stats.overdue },
          ]} />
        <label className="search-field narrow">
          <Icon name="search" size={16} />
          <input type="text" value={q} placeholder="Find an owner" onChange={(e) => setQ(e.target.value)} aria-label="Find an owner" />
        </label>
      </div>

      {stats.atRisk === 0 && (
        <div className="card"><EmptyState icon="check-circle" title="Nothing outstanding">Every instance is Green or Blue. Nice work.</EmptyState></div>
      )}
      {stats.atRisk > 0 && visible.length === 0 && (
        <div className="card"><EmptyState icon="search" title="No owners match these filters">Try a different filter.</EmptyState></div>
      )}

      {visible.map((g) => {
        const chase = g.items.filter((i) => !i.hasPlan || i.overdue);
        const href = chase.length ? mailto({
          to: g.email, subject: `[Action required] Upgrade plan needed for ${chase.length} technology instance${chase.length === 1 ? "" : "s"}`,
          body: reminderBody(g.owner, chase.map((i) => ({ tech: techLabel(i.component), app: `${i.app.app_name}, ${i.app.app_id}`, status: i.component.status, end: i.component.supportEnd, pastEnd: i.days < 0 }))),
        }) : null;
        return (
          <section key={g.key} className="card owner-card">
            <header className="owner-head">
              <Avatar name={g.owner} size={46} />
              <div className="owner-id">
                <h3>{g.owner}</h3>
                <a href={`mailto:${g.email}`}>{g.email}</a>
              </div>
              <div className="owner-progress">
                <span><b>{g.withPlan}</b>/{g.items.length} plans submitted{g.overdue > 0 && <em className="neg"> &middot; {g.overdue} overdue</em>}</span>
                <HatchBar pct={pct(g.withPlan, g.items.length)} color="#f5a524" />
              </div>
              {href
                ? <a className="btn btn-outline btn-sm" href={href}><Icon name="mail" size={14} /> Email reminder</a>
                : <span className="tag green">All plans in</span>}
            </header>
            <div className="table-scroll">
              <table className="tbl compact fixed">
                <colgroup><col style={{ width: "24%" }} /><col style={{ width: "21%" }} /><col style={{ width: "15%" }} /><col style={{ width: "12%" }} /><col />{isAdmin && <col style={{ width: 132 }} />}</colgroup>
                <thead><tr><th>Application</th><th>Technology</th><th>Support</th><th>Status</th><th>Upgrade plan</th>{isAdmin && <th><span className="sr-only">Action</span></th>}</tr></thead>
                <tbody>
                  {g.shown.map((i) => (
                    <tr key={i.component.id} className="clickable" tabIndex={0} onClick={() => onOpenApp(i.app.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") onOpenApp(i.app.id); }}>
                      <td><div className="cell-title">{i.app.app_name}</div><div className="cell-sub">{i.app.app_id}</div></td>
                      <td><div className="cell-title">{techLabel(i.component)}</div><div className="cell-sub"><Icon name={LAYER[i.component.component_type].icon} size={12} /> {LAYER[i.component.component_type].singular}</div></td>
                      <td><div className="cell-title">{fmtDate(i.component.supportEnd)}</div><div className={`cell-sub${i.days < 0 ? " neg" : ""}`}>{relativeText(i.days)}</div></td>
                      <td><StatusPill status={i.component.status} /></td>
                      <td className="plan-cell"><PlanCell c={i.component} overdue={i.overdue} /></td>
                      {isAdmin && (
                        <td className="actions" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => onPlan(i.app, i.component)}>{i.hasPlan ? "Update plan" : "Submit plan"}</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </>
  );
}
