import { useEscapeKey } from "../hooks.js";
import { useState } from "react";

export default function LoginModal({ onClose, onSubmit }) {
  useEscapeKey(onClose);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Admin Login</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="field">
              <label htmlFor="admin-password">Admin password</label>
              <input
                id="admin-password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="error-text">{error}</div>}
            <div className="hint-text" style={{ marginTop: 10 }}>
              Admin Mode is used for onboarding new applications, editing the
              dataset, and (by Red/Amber owners) submitting upgrade plans.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !password}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
