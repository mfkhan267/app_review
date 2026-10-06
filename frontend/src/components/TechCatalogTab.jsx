import { useMemo, useState } from "react";

const GROUPS = ["Application", "Database", "OS"];

export default function TechCatalogTab({ catalog, isAdmin, onAdd, onEdit, onDelete }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return catalog.filter(
      (c) => !needle || `${c.tech_name} ${c.version}`.toLowerCase().includes(needle)
    );
  }, [catalog, q]);

  return (
    <div>
      <div className="toolbar">
        <div>
          <h2 className="tab-title">Technology Catalog</h2>
          <p className="hint-text">
            Approved technologies and their vendor support dates (EOSS / EOES). Selecting one of
            these when onboarding or editing an app fills in the support dates automatically.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={onAdd}>+ Add catalog entry</button>
        )}
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search technology or version..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {GROUPS.map((type) => {
        const rows = filtered.filter((c) => c.component_type === type);
        if (!rows.length) return null;
        return (
          <div key={type} className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12 }}>{type}</h3>
            <div className="table-wrap" style={{ boxShadow: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Technology</th>
                    <th>Version</th>
                    <th>EOSS date</th>
                    <th>EOES date</th>
                    <th>Notes</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td>{c.tech_name}</td>
                      <td>{c.version}</td>
                      <td>{c.eoss_date}</td>
                      <td>{c.eoes_date || <span className="hint-text">&mdash;</span>}</td>
                      <td style={{ whiteSpace: "normal", maxWidth: 260 }}>
                        {c.notes || <span className="hint-text">&mdash;</span>}
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="row-actions">
                            <button className="btn btn-outline btn-sm" onClick={() => onEdit(c)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => onDelete(c)}>Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="table-wrap"><div className="empty-state">No catalog entries match your search.</div></div>
      )}
    </div>
  );
}
