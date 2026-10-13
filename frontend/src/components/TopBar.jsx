import { TABS } from "../constants.js";
import GlobalSearch from "./GlobalSearch.jsx";
import Icon from "./Icon.jsx";

export default function TopBar({ tab, onTab, isAdmin, onLogin, onLogout, bellCount, apps, onOpenApp, onOpenTech }) {
  return (
    <div className="topbar-wrap">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand-name">EOS<small>Command Center</small></span>
        </div>

        <nav className="nav" aria-label="Primary">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`nav-pill${tab === t.id ? " active" : ""}`}
              aria-current={tab === t.id ? "page" : undefined} onClick={() => onTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          <GlobalSearch apps={apps} onOpenApp={onOpenApp} onOpenTech={onOpenTech} />
          <button type="button" className="icon-btn bell" onClick={() => onTab("remediation")}
            aria-label={bellCount ? `${bellCount} at-risk instances have no upgrade plan` : "No outstanding upgrade plans"}
            title={bellCount ? `${bellCount} at-risk instances have no upgrade plan` : "All at-risk instances have a plan"}>
            <Icon name="bell" size={18} />
            {bellCount > 0 && <span className="bell-count">{bellCount > 99 ? "99+" : bellCount}</span>}
          </button>
          {isAdmin ? (
            <>
              <span className="mode-chip"><Icon name="shield" size={14} />Admin</span>
              <button type="button" className="icon-btn" onClick={onLogout} aria-label="Log out" title="Log out"><Icon name="log-out" size={18} /></button>
            </>
          ) : (
            <button type="button" className="btn btn-dark btn-sm" onClick={onLogin}><Icon name="lock" size={14} /> Admin login</button>
          )}
        </div>
      </header>
    </div>
  );
}

export function AdminBar({ importBusy, onImport, onOnboard }) {
  return (
    <div className="adminbar">
      <span className="adminbar-msg"><Icon name="shield" size={16} /> Admin mode &mdash; changes are saved to the database immediately.</span>
      <div className="adminbar-actions">
        <label className="btn btn-outline btn-sm import-label">
          <Icon name="upload" size={14} /> {importBusy ? "Importing..." : "Import Excel"}
          <input type="file" accept=".xlsx,.xls" onChange={onImport} disabled={importBusy} style={{ display: "none" }} />
        </label>
        <button type="button" className="btn btn-dark btn-sm" onClick={onOnboard}><Icon name="plus" size={14} /> Onboard application</button>
      </div>
    </div>
  );
}
