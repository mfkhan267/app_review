import { useMemo, useState } from "react";
import { allComponents, byStatus } from "../aggregations.js";
import { LAYER, STATUS, STATUS_ORDER } from "../constants.js";
import ComponentTable from "./ComponentTable.jsx";
import Icon from "./Icon.jsx";
import { FilterChips, PageHeader } from "./ui.jsx";

const SUBTITLES = {
  Application: "Runtimes, frameworks and languages across the portfolio",
  Database: "Database engines and versions across the portfolio",
  OS: "Server and platform operating systems across the portfolio",
};

export default function LayerTab({ apps, type, isAdmin, preset, today, onOpenApp, onEditApp, onPlan, onExport }) {
  const [filters, setFilters] = useState({ q: preset?.q || "", tech: preset?.tech || "", status: preset?.status || "" });
  const rows = useMemo(() => allComponents(apps).filter((c) => c.component_type === type), [apps, type]);
  const techs = useMemo(() => [...new Set(rows.map((c) => c.tech_name))].sort(), [rows]);
  const counts = byStatus(rows);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return rows.filter((c) => {
      if (filters.tech && c.tech_name !== filters.tech) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (q && !`${c.app_id} ${c.app_name} ${c.app_owner} ${c.tech_name} ${c.version || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, filters]);

  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const filtersOn = filters.q || filters.tech || filters.status;

  return (
    <>
      <PageHeader title={LAYER[type].label} subtitle={`${SUBTITLES[type]} \u00B7 ${rows.length} instances`}>
        <button type="button" className="btn btn-soft" onClick={() => onExport(filtered, LAYER[type].label)}><Icon name="download" size={16} /> Export CSV</button>
      </PageHeader>

      <div className="card strip">
        <div className="strip-bar" aria-hidden="true">
          {STATUS_ORDER.map((k) => (counts[k] ? (
            <button key={k} type="button" tabIndex={-1} className={`strip-seg${k === "RED" ? " hatch" : ""}${filters.status && filters.status !== k ? " dim" : ""}`}
              style={{ flexGrow: counts[k], background: STATUS[k].color }} title={`${counts[k]} ${STATUS[k].label}`}
              onClick={() => set("status")(filters.status === k ? "" : k)} />
          ) : null))}
        </div>
        <FilterChips label="Filter by status" value={filters.status} onChange={set("status")}
          options={[{ value: "", label: "All", count: rows.length },
            ...STATUS_ORDER.map((k) => ({ value: k, label: STATUS[k].label, count: counts[k], color: STATUS[k].color }))]} />
      </div>

      <div className="toolbar-card">
        <label className="search-field">
          <Icon name="search" size={16} />
          <input type="text" value={filters.q} placeholder={`Search ${LAYER[type].label.toLowerCase()}, apps or owners`}
            onChange={(e) => set("q")(e.target.value)} aria-label="Search" />
        </label>
        <select value={filters.tech} onChange={(e) => set("tech")(e.target.value)} aria-label="Filter by technology">
          <option value="">All technologies</option>
          {techs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="result-count">{filtered.length} of {rows.length} shown</span>
        {filtersOn && <button type="button" className="link-btn" onClick={() => setFilters({ q: "", tech: "", status: "" })}>Clear filters</button>}
      </div>

      <ComponentTable rows={filtered} today={today} isAdmin={isAdmin} onOpenApp={onOpenApp} onEditApp={onEditApp} onPlan={onPlan} />
    </>
  );
}
