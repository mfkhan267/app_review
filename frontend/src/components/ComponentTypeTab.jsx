import { useMemo, useState } from "react";

import { allComponents, byStatus } from "../aggregations.js";
import ComponentTable from "./ComponentTable.jsx";
import FilterBar from "./FilterBar.jsx";
import StatCard from "./StatCard.jsx";

const TITLES = {
  Application: ["Applications", "Runtimes, frameworks, and languages across the portfolio"],
  Database: ["Databases", "Database engines and versions across the portfolio"],
  OS: ["Operating Systems", "Server and platform OS versions across the portfolio"],
};

export default function ComponentTypeTab({ apps, type, isAdmin, onEditApp, onUpdatePlan }) {
  const [filters, setFilters] = useState({ q: "", tech_name: "", status: "" });
  const [title, subtitle] = TITLES[type];

  const rows = useMemo(() => allComponents(apps).filter((c) => c.component_type === type), [apps, type]);

  const techNames = useMemo(() => [...new Set(rows.map((c) => c.tech_name))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = filters.q.toLowerCase();
    return rows.filter((c) => {
      if (filters.tech_name && c.tech_name !== filters.tech_name) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (q) {
        const hay = `${c.app_id} ${c.app_name} ${c.app_owner} ${c.tech_name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const counts = byStatus(rows);

  return (
    <div>
      <h2 className="tab-title">{title}</h2>
      <p className="hint-text" style={{ marginBottom: 16 }}>{subtitle}</p>

      <div className="stat-row">
        <StatCard label="Total" value={rows.length} />
        <StatCard label="Green" value={counts.GREEN} accent="#2e7d32" />
        <StatCard label="Amber" value={counts.AMBER} accent="#f9a825" />
        <StatCard label="Red" value={counts.RED} accent="#c62828" />
        <StatCard label="Blue" value={counts.BLUE} accent="#1565c0" />
      </div>

      <FilterBar filters={filters} setFilters={setFilters} techNames={techNames} showPlatform={false} />

      <ComponentTable rows={filtered} isAdmin={isAdmin} onEditApp={onEditApp} onUpdatePlan={onUpdatePlan} />
    </div>
  );
}
