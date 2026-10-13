import { useMemo, useState } from "react";
import { techLabel } from "../aggregations.js";
import { STATUS_ORDER } from "../constants.js";
import { daysBetween, fmtDate, relativeText } from "../lib/dates.js";
import Icon from "./Icon.jsx";
import { Avatar, StatusPill } from "./ui.jsx";

const sev = (s) => STATUS_ORDER.indexOf(s);
const COLUMNS = [
  { key: "app", label: "Application", cmp: (a, b) => a.app_name.localeCompare(b.app_name) },
  { key: "tech", label: "Technology", cmp: (a, b) => techLabel(a).localeCompare(techLabel(b)) },
  { key: "end", label: "Support ends", cmp: (a, b) => a.supportEnd - b.supportEnd },
  { key: "status", label: "Status", cmp: (a, b) => sev(a.status) - sev(b.status) },
  { key: "owner", label: "Owner", cmp: (a, b) => a.app_owner.localeCompare(b.app_owner) },
  { key: "plan", label: "Upgrade plan", cmp: (a, b) => Number(!!a.upgrade_plan) - Number(!!b.upgrade_plan) },
];

export function PlanCell({ c, overdue }) {
  const atRisk = c.status === "RED" || c.status === "AMBER";
  if (c.upgrade_plan) {
    return (
      <>
        <span className="plan-text" title={c.upgrade_plan}>{c.upgrade_plan}</span>
        <span className="cell-sub">
          {c.upgrade_target_date ? `Target ${fmtDate(c.upgrade_target_date)}` : "No target date"}
          {overdue && <span className="tag red">Overdue</span>}
        </span>
      </>
    );
  }
  return atRisk ? <span className="tag red-soft">No plan</span> : <span className="muted">&mdash;</span>;
}

export default function ComponentTable({ rows, today, isAdmin, onOpenApp, onEditApp, onPlan }) {
  const [sort, setSort] = useState({ key: "status", dir: 1 });
  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sort.key);
    return rows.slice().sort((a, b) => sort.dir * col.cmp(a, b) || a.supportEnd - b.supportEnd);
  }, [rows, sort]);

  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  return (
    <div className="card table-card">
      <div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" className="th-btn" onClick={() => toggle(c.key)}>
                    {c.label}
                    {sort.key === c.key && <Icon name={sort.dir === 1 ? "chevron-up" : "chevron-down"} size={13} />}
                  </button>
                </th>
              ))}
              {isAdmin && <th className="th-actions"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const days = daysBetween(today, c.supportEnd);
              const atRisk = c.status === "RED" || c.status === "AMBER";
              const overdue = atRisk && c.upgrade_plan && c.upgrade_target_date && daysBetween(today, c.upgrade_target_date) < 0;
              return (
                <tr key={c.id} className="clickable" tabIndex={0} onClick={() => onOpenApp(c._appPk)}
                  onKeyDown={(e) => { if (e.key === "Enter") onOpenApp(c._appPk); }}>
                  <td><div className="cell-title">{c.app_name}</div><div className="cell-sub">{c.app_id} &middot; {c.platform}</div></td>
                  <td><div className="cell-title">{techLabel(c)}</div></td>
                  <td>
                    <div className="cell-title">{fmtDate(c.supportEnd)}</div>
                    <div className={`cell-sub${c.status === "RED" ? " neg" : ""}`}>
                      {relativeText(days)}{c.status === "BLUE" && ` \u00B7 extended (standard ended ${fmtDate(c.eol_date)})`}
                    </div>
                  </td>
                  <td><StatusPill status={c.status} /></td>
                  <td><div className="owner-cell"><Avatar name={c.app_owner} size={28} /><span>{c.app_owner}</span></div></td>
                  <td className="plan-cell"><PlanCell c={c} overdue={overdue} /></td>
                  {isAdmin && (
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      {atRisk && <button type="button" className="icon-btn sm" title="Submit or update upgrade plan" aria-label={`Upgrade plan for ${techLabel(c)}`} onClick={() => onPlan(c)}><Icon name="flag" size={15} /></button>}
                      <button type="button" className="icon-btn sm" title="Edit application" aria-label={`Edit ${c.app_name}`} onClick={() => onEditApp(c._appPk)}><Icon name="edit" size={15} /></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!sorted.length && (
        <div className="table-empty">No technology instances match the current filters.</div>
      )}
    </div>
  );
}
