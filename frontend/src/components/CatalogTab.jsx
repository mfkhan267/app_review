import { useMemo, useState } from "react";
import { allComponents, catalogUsage } from "../aggregations.js";
import { LAYER, LAYERS } from "../constants.js";
import { daysBetween, fmtDate } from "../lib/dates.js";
import Icon from "./Icon.jsx";
import { FilterChips, PageHeader } from "./ui.jsx";

export default function CatalogTab({ catalog, apps, today, isAdmin, onAdd, onEdit, onDelete }) {
  const [q, setQ] = useState("");
  const [layer, setLayer] = useState("");
  const usage = useMemo(() => catalogUsage(allComponents(apps), catalog), [apps, catalog]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.filter((e) => (!layer || e.component_type === layer) && (!needle || `${e.tech_name} ${e.version} ${e.notes || ""}`.toLowerCase().includes(needle)));
  }, [catalog, q, layer]);

  return (
    <>
      <PageHeader title="Technology Catalog"
        subtitle="Approved technologies and their vendor support dates. Picking one when onboarding or editing an application fills in the dates automatically.">
        {isAdmin && <button type="button" className="btn btn-dark" onClick={onAdd}><Icon name="plus" size={16} /> Add catalog entry</button>}
      </PageHeader>

      <div className="toolbar-card">
        <FilterChips label="Filter by layer" value={layer} onChange={setLayer}
          options={[{ value: "", label: "All", count: catalog.length },
            ...LAYERS.map((l) => ({ value: l, label: LAYER[l].label, count: catalog.filter((e) => e.component_type === l).length }))]} />
        <label className="search-field narrow">
          <Icon name="search" size={16} />
          <input type="text" value={q} placeholder="Search technology or version" onChange={(e) => setQ(e.target.value)} aria-label="Search catalog" />
        </label>
      </div>

      {LAYERS.map((type) => {
        const rows = filtered.filter((e) => e.component_type === type);
        if (!rows.length) return null;
        return (
          <section key={type} className="card table-card catalog-group">
            <h3 className="group-title"><span className="group-icon"><Icon name={LAYER[type].icon} size={16} /></span>{LAYER[type].label}<small>{rows.length}</small></h3>
            <div className="table-scroll">
              <table className="tbl fixed">
                <colgroup><col style={{ width: "20%" }} /><col style={{ width: "9%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "19%" }} /><col />{isAdmin && <col style={{ width: 100 }} />}</colgroup>
                <thead><tr><th>Technology</th><th>Version</th><th>EOSS</th><th>EOES</th><th>In use</th><th>Notes</th>{isAdmin && <th><span className="sr-only">Actions</span></th>}</tr></thead>
                <tbody>
                  {rows.map((e) => {
                    const u = usage.get(e.id) || { count: 0, drift: 0 };
                    const gone = daysBetween(today, e.eoss_date) < 0;
                    return (
                      <tr key={e.id}>
                        <td><div className="cell-title">{e.tech_name}</div></td>
                        <td>{e.version}</td>
                        <td className={gone ? "neg" : ""}>{fmtDate(e.eoss_date)}</td>
                        <td>{e.eoes_date ? fmtDate(e.eoes_date) : <span className="muted">&mdash;</span>}</td>
                        <td>
                          {u.count ? <>{u.count} instance{u.count === 1 ? "" : "s"}{u.drift > 0 && <span className="tag amber" title="Dates on these instances differ from the catalog">{u.drift} out of sync</span>}</> : <span className="muted">Not in use</span>}
                        </td>
                        <td className="notes-cell">{e.notes || <span className="muted">&mdash;</span>}</td>
                        {isAdmin && (
                          <td className="actions">
                            <button type="button" className="icon-btn sm" title="Edit entry" aria-label={`Edit ${e.tech_name} ${e.version}`} onClick={() => onEdit(e)}><Icon name="edit" size={15} /></button>
                            <button type="button" className="icon-btn sm danger" title="Delete entry" aria-label={`Delete ${e.tech_name} ${e.version}`} onClick={() => onDelete(e)}><Icon name="trash" size={15} /></button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {filtered.length === 0 && <div className="card table-card"><div className="table-empty">No catalog entries match your search.</div></div>}
    </>
  );
}
