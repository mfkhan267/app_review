import { useState } from "react";

export default function UpgradePlanModal({ app, component, onClose, onSubmit }) {
  const [plan, setPlan] = useState(component.upgrade_plan || "");
  const [targetDate, setTargetDate] = useState(component.upgrade_target_date || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(component.id, { upgrade_plan: plan, upgrade_target_date: targetDate || null });
      onClose();
    } catch (err) {
      setError(err.message || "Could not save upgrade plan");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upgrade plan &mdash; {app.app_name}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="hint-text" style={{ marginBottom: 14 }}>
              {app.app_id} &middot; {component.component_type}: {component.tech_name}
              {component.version ? ` ${component.version}` : ""} &middot; End of Support{" "}
              {component.eol_date} &middot; <span className={`badge ${component.status}`}>{component.status}</span>
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="plan">Upgrade / remediation plan</label>
              <textarea
                id="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="e.g. Upgrade to Java 17 LTS, vendor PO raised, target Q2 2027"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="target">Target completion date</label>
              <input
                id="target"
                type="date"
                value={targetDate || ""}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            {error && <div className="error-text">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Save upgrade plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
