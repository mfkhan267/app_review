import { useState } from "react";

const EMPTY = { component_type: "Application", tech_name: "", version: "", eoss_date: "", eoes_date: "", notes: "" };

export default function CatalogEntryModal({ entry, onClose, onSubmit }) {
  const isEdit = Boolean(entry);
  const [form, setForm] = useState(entry ? { ...EMPTY, ...entry } : EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const field = (name) => ({
    value: form[name] ?? "",
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
  });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit({ ...form, eoes_date: form.eoes_date || null, notes: form.notes || null }, entry?.id);
      onClose();
    } catch (err) {
      setError(err.message || "Could not save catalog entry");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit catalog entry" : "Add catalog entry"}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field">
                <label>Component layer</label>
                <select {...field("component_type")} required>
                  <option value="Application">Application</option>
                  <option value="Database">Database</option>
                  <option value="OS">OS</option>
                </select>
              </div>
              <div className="field" />
              <div className="field">
                <label>Technology</label>
                <input {...field("tech_name")} required placeholder="e.g. Java, PostgreSQL, RHEL" />
              </div>
              <div className="field">
                <label>Version</label>
                <input {...field("version")} required placeholder="e.g. 17, 14, 9" />
              </div>
              <div className="field">
                <label>EOSS date (End of Standard Support)</label>
                <input type="date" {...field("eoss_date")} required />
              </div>
              <div className="field">
                <label>EOES date (End of Extended Support, optional)</label>
                <input type="date" {...field("eoes_date")} />
              </div>
              <div className="field full">
                <label>Notes</label>
                <input {...field("notes")} placeholder="e.g. LTS, approved for new projects" />
              </div>
            </div>
            {error && <div className="error-text" style={{ marginTop: 14 }}>{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving..." : isEdit ? "Save changes" : "Add to catalog"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
