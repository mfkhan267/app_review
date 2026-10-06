import { useEffect, useMemo, useState } from "react";

import { allComponents, byType } from "./aggregations.js";
import { api } from "./api.js";
import AppFormModal from "./components/AppFormModal.jsx";
import CatalogEntryModal from "./components/CatalogEntryModal.jsx";
import ComponentTypeTab from "./components/ComponentTypeTab.jsx";
import ExecutiveDashboardTab from "./components/ExecutiveDashboardTab.jsx";
import Header from "./components/Header.jsx";
import LoginModal from "./components/LoginModal.jsx";
import OwnerRemediationTab from "./components/OwnerRemediationTab.jsx";
import TabNav from "./components/TabNav.jsx";
import TechCatalogTab from "./components/TechCatalogTab.jsx";
import UpgradePlanModal from "./components/UpgradePlanModal.jsx";

const TOKEN_KEY = "eos_admin_token";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [apps, setApps] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("executive");

  const [showLogin, setShowLogin] = useState(false);
  const [editingApp, setEditingApp] = useState(null);     // object = edit, "NEW" = create
  const [planTarget, setPlanTarget] = useState(null);      // { app, component }
  const [editingCatalogEntry, setEditingCatalogEntry] = useState(null); // object = edit, "NEW" = create
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const isAdmin = Boolean(token);

  const refresh = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [appsData, catalogData] = await Promise.all([api.listApps(), api.listCatalog()]);
      setApps(appsData);
      setCatalog(catalogData);
    } catch (err) {
      setLoadError(err.message || "Could not load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const tabCounts = useMemo(() => {
    const components = allComponents(apps);
    const types = byType(components);
    const outstanding = apps.reduce(
      (n, a) => n + a.components.filter((c) => c.status === "RED" || c.status === "AMBER").length,
      0
    );
    return {
      Application: types.Application?.total ?? 0,
      Database: types.Database?.total ?? 0,
      OS: types.OS?.total ?? 0,
      remediation: outstanding,
    };
  }, [apps]);

  const handleLogin = async (password) => {
    const res = await api.login(password);
    setToken(res.token);
    localStorage.setItem(TOKEN_KEY, res.token);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem(TOKEN_KEY);
  };

  const handleSaveApp = async (payload, existingId) => {
    if (existingId) {
      await api.updateApp(token, existingId, payload);
    } else {
      await api.createApp(token, payload);
    }
    await refresh();
  };

  const handleDelete = async (app) => {
    if (!confirm(`Delete ${app.app_id} - ${app.app_name}? This removes all its components too.`)) return;
    await api.deleteApp(token, app.id);
    await refresh();
  };

  const handleUpdatePlan = async (componentId, body) => {
    await api.updateUpgradePlan(token, componentId, body);
    await refresh();
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportBusy(true);
    setImportMsg("");
    try {
      const result = await api.importExcel(token, file);
      setImportMsg(
        `Imported: ${result.apps_created} app(s) created, ${result.apps_updated} updated` +
          (result.errors.length ? `, ${result.errors.length} row error(s)` : "")
      );
      await refresh();
    } catch (err) {
      setImportMsg(err.message || "Import failed");
    } finally {
      setImportBusy(false);
      e.target.value = "";
    }
  };

  const openEditByPk = (appPk) => {
    const found = apps.find((a) => a.id === appPk);
    if (found) setEditingApp(found);
  };

  const handleSaveCatalogEntry = async (payload, existingId) => {
    if (existingId) {
      await api.updateCatalogEntry(token, existingId, payload);
    } else {
      await api.createCatalogEntry(token, payload);
    }
    await refresh();
  };

  const handleDeleteCatalogEntry = async (entry) => {
    if (!confirm(`Remove ${entry.tech_name} ${entry.version} from the catalog?`)) return;
    await api.deleteCatalogEntry(token, entry.id);
    await refresh();
  };

  return (
    <div className="app-shell">
      <Header isAdmin={isAdmin} onLoginClick={() => setShowLogin(true)} onLogout={handleLogout} />

      <div className="tab-bar-row">
        <TabNav active={activeTab} onChange={setActiveTab} counts={tabCounts} />
        {isAdmin && activeTab !== "catalog" && (
          <div className="tab-bar-actions">
            <label className="btn btn-outline btn-sm import-label">
              {importBusy ? "Importing..." : "Import Excel"}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                disabled={importBusy}
                style={{ display: "none" }}
              />
            </label>
            <button className="btn btn-primary btn-sm" onClick={() => setEditingApp("NEW")}>
              + Onboard application
            </button>
          </div>
        )}
      </div>
      {importMsg && <div className="hint-text" style={{ padding: "0 32px", marginTop: 8 }}>{importMsg}</div>}

      <main className="main">
        {loading && <div className="empty-state">Loading...</div>}
        {loadError && <div className="error-text">{loadError}</div>}

        {!loading && !loadError && (
          <>
            {activeTab === "executive" && (
              <ExecutiveDashboardTab apps={apps} onOpenType={setActiveTab} />
            )}
            {["Application", "Database", "OS"].includes(activeTab) && (
              <ComponentTypeTab
                apps={apps}
                type={activeTab}
                isAdmin={isAdmin}
                onEditApp={openEditByPk}
                onUpdatePlan={(c) => {
                  const app = apps.find((a) => a.id === c._appPk);
                  setPlanTarget({ app, component: c });
                }}
              />
            )}
            {activeTab === "remediation" && (
              <OwnerRemediationTab
                apps={apps}
                isAdmin={isAdmin}
                onUpdatePlan={(app, component) => setPlanTarget({ app, component })}
              />
            )}
            {activeTab === "catalog" && (
              <TechCatalogTab
                catalog={catalog}
                isAdmin={isAdmin}
                onAdd={() => setEditingCatalogEntry("NEW")}
                onEdit={(entry) => setEditingCatalogEntry(entry)}
                onDelete={handleDeleteCatalogEntry}
              />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        Application &amp; Database End-of-Support Review &middot; RED and AMBER items require an
        owner-submitted upgrade plan &middot; Used for quarterly CTO review.
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSubmit={handleLogin} />}

      {editingApp && (
        <AppFormModal
          app={editingApp === "NEW" ? null : editingApp}
          catalog={catalog}
          onClose={() => setEditingApp(null)}
          onSubmit={handleSaveApp}
          onDelete={editingApp !== "NEW" ? () => { handleDelete(editingApp); setEditingApp(null); } : undefined}
        />
      )}

      {planTarget && (
        <UpgradePlanModal
          app={planTarget.app}
          component={planTarget.component}
          onClose={() => setPlanTarget(null)}
          onSubmit={handleUpdatePlan}
        />
      )}

      {editingCatalogEntry && (
        <CatalogEntryModal
          entry={editingCatalogEntry === "NEW" ? null : editingCatalogEntry}
          onClose={() => setEditingCatalogEntry(null)}
          onSubmit={handleSaveCatalogEntry}
        />
      )}
    </div>
  );
}
