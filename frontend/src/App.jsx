import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { allComponents, isAtRisk } from "./aggregations.js";
import { api } from "./api.js";
import AppFormModal from "./components/AppFormModal.jsx";
import CatalogEntryModal from "./components/CatalogEntryModal.jsx";
import CatalogTab from "./components/CatalogTab.jsx";
import DashboardTab from "./components/DashboardTab.jsx";
import { AppDrawerContent, Drawer, StatusDrawerContent } from "./components/Drawer.jsx";
import Icon from "./components/Icon.jsx";
import LayerTab from "./components/LayerTab.jsx";
import LoginModal from "./components/LoginModal.jsx";
import RemediationTab from "./components/RemediationTab.jsx";
import TopBar, { AdminBar } from "./components/TopBar.jsx";
import UpgradePlanModal from "./components/UpgradePlanModal.jsx";
import { SkeletonDashboard, Toasts } from "./components/ui.jsx";
import { STATUS, TABS } from "./constants.js";
import { downloadCsv } from "./lib/csv.js";
import { fmtDate, startOfDay, toISO } from "./lib/dates.js";

const TOKEN_KEY = "eos_admin_token";

const CSV_COLUMNS = [
  { label: "App ID", value: (c) => c.app_id },
  { label: "Application", value: (c) => c.app_name },
  { label: "Platform", value: (c) => c.platform },
  { label: "Layer", value: (c) => c.component_type },
  { label: "Technology", value: (c) => c.tech_name },
  { label: "Version", value: (c) => c.version },
  { label: "Standard support ends (EOSS)", value: (c) => c.eol_date },
  { label: "Extended support ends (EOES)", value: (c) => c.extended_support_date },
  { label: "Effective support end", value: (c) => (c.supportEnd ? toISO(c.supportEnd) : "") },
  { label: "Status", value: (c) => STATUS[c.status]?.label },
  { label: "Application owner", value: (c) => c.app_owner },
  { label: "Application owner email", value: (c) => c.app_owner_email },
  { label: "Platform owner", value: (c) => c.platform_owner },
  { label: "Upgrade plan", value: (c) => c.upgrade_plan },
  { label: "Plan target date", value: (c) => c.upgrade_target_date },
];

const tabFromHash = () => {
  const h = window.location.hash.replace(/^#\/?/, "");
  return TABS.find((t) => t.hash === h)?.id || "dashboard";
};
const isAuthError = (err) => /admin token/i.test(err?.message || "");

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [apps, setApps] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [today, setToday] = useState(() => startOfDay());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState(() => ({ tab: tabFromHash(), preset: null, nonce: 0 }));
  const [drawer, setDrawer] = useState([]);                 // stack of { type: "app"|"status", ... }
  const [showLogin, setShowLogin] = useState(false);
  const [editingApp, setEditingApp] = useState(null);       // app object = edit, "NEW" = create
  const [planTarget, setPlanTarget] = useState(null);       // { app, component }
  const [editingEntry, setEditingEntry] = useState(null);   // catalog entry = edit, "NEW" = create
  const [importBusy, setImportBusy] = useState(false);
  const [toasts, setToasts] = useState([]);
  const loadedOnce = useRef(false);

  const isAdmin = Boolean(token);
  const modalOpen = showLogin || Boolean(editingApp) || Boolean(planTarget) || Boolean(editingEntry);

  const notify = useCallback((message, tone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const refresh = useCallback(async () => {
    if (!loadedOnce.current) setLoading(true);   // only show the skeleton on first load
    setLoadError("");
    try {
      const [a, c] = await Promise.all([api.listApps(), api.listCatalog()]);
      setApps(a);
      setCatalog(c);
      setToday(startOfDay());
      loadedOnce.current = true;
    } catch (err) {
      setLoadError(err.message || "Could not load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Navigation: tab + optional preset filters, mirrored into the URL hash so views are linkable.
  const go = useCallback((tab, preset = null) => {
    setView({ tab, preset, nonce: Date.now() });
    setDrawer([]);
    const hash = `#/${TABS.find((t) => t.id === tab).hash}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => {
      const t = tabFromHash();
      setView((v) => (v.tab === t ? v : { tab: t, preset: null, nonce: Date.now() }));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const components = useMemo(() => allComponents(apps), [apps]);
  const missingPlans = useMemo(() => components.filter((c) => isAtRisk(c) && !c.upgrade_plan).length, [components]);

  // ---- auth ----
  const handleLogin = async (password) => {
    const res = await api.login(password);
    setToken(res.token);
    localStorage.setItem(TOKEN_KEY, res.token);
    setShowLogin(false);
    notify("Signed in. Admin mode is on.");
  };
  const handleLogout = useCallback((silent) => {
    setToken("");
    localStorage.removeItem(TOKEN_KEY);
    if (silent !== true) notify("Signed out.");
  }, [notify]);
  // Wrap admin calls: if the session expired, drop back to User Mode with a clear message.
  const authed = async (fn) => {
    try { return await fn(); } catch (err) {
      if (isAuthError(err)) { handleLogout(true); notify("Your admin session expired. Please sign in again.", "error"); }
      throw err;
    }
  };

  // ---- drawer ----
  const openApp = useCallback((pk) => setDrawer((d) => (d.length && d[d.length - 1].type === "status" ? [...d, { type: "app", appPk: pk }] : [{ type: "app", appPk: pk }])), []);
  const openStatus = useCallback((status) => setDrawer([{ type: "status", status }]), []);
  const closeDrawer = useCallback(() => setDrawer([]), []);
  const popDrawer = useCallback(() => setDrawer((d) => d.slice(0, -1)), []);
  const top = drawer[drawer.length - 1];

  // ---- data mutations ----
  const handleSaveApp = async (payload, existingId) => {
    await authed(() => (existingId ? api.updateApp(token, existingId, payload) : api.createApp(token, payload)));
    await refresh();
    notify(existingId ? `${payload.app_name} updated.` : `${payload.app_name} onboarded.`);
  };
  const handleDelete = async (app) => {
    if (!window.confirm(`Delete ${app.app_id} \u2013 ${app.app_name}? This also removes its ${app.components.length} component(s).`)) return false;
    try {
      await authed(() => api.deleteApp(token, app.id));
      await refresh();
      setDrawer([]);
      notify(`${app.app_name} deleted.`);
      return true;
    } catch (err) { notify(err.message || "Could not delete application.", "error"); return false; }
  };
  const handleUpdatePlan = async (componentId, body) => {
    await authed(() => api.updateUpgradePlan(token, componentId, body));
    await refresh();
    notify("Upgrade plan saved.");
  };
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportBusy(true);
    try {
      const r = await authed(() => api.importExcel(token, file));
      await refresh();
      notify(`Import complete: ${r.apps_created} created, ${r.apps_updated} updated${r.errors.length ? `, ${r.errors.length} row error(s)` : ""}.`, r.errors.length ? "error" : "ok");
    } catch (err) {
      if (!isAuthError(err)) notify(err.message || "Import failed.", "error");
    } finally {
      setImportBusy(false);
      e.target.value = "";
    }
  };
  const handleSaveEntry = async (payload, existingId) => {
    await authed(() => (existingId ? api.updateCatalogEntry(token, existingId, payload) : api.createCatalogEntry(token, payload)));
    await refresh();
    notify(`${payload.tech_name} ${payload.version} ${existingId ? "updated" : "added to the catalog"}.`);
  };
  const handleDeleteEntry = async (entry) => {
    if (!window.confirm(`Remove ${entry.tech_name} ${entry.version} from the catalog? Existing applications keep their dates.`)) return;
    try {
      await authed(() => api.deleteCatalogEntry(token, entry.id));
      await refresh();
      notify(`${entry.tech_name} ${entry.version} removed.`);
    } catch (err) { notify(err.message || "Could not remove entry.", "error"); }
  };

  const exportCsv = (rows, name) =>
    downloadCsv(`eos-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${toISO(today)}.csv`, CSV_COLUMNS, rows);

  const editByPk = (pk) => { const a = apps.find((x) => x.id === pk); if (a) setEditingApp(a); };
  const planFor = (c) => { const app = apps.find((a) => a.id === c._appPk); if (app) setPlanTarget({ app, component: c }); };

  const common = { apps, isAdmin, today, onOpenApp: openApp };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <TopBar tab={view.tab} onTab={(t) => go(t)} isAdmin={isAdmin} onLogin={() => setShowLogin(true)} onLogout={() => handleLogout()}
        bellCount={missingPlans} apps={apps} onOpenApp={openApp} onOpenTech={(t) => go(t.type, { q: t.name })} />
      {isAdmin && <AdminBar importBusy={importBusy} onImport={handleImport} onOnboard={() => setEditingApp("NEW")} />}

      <main className="page" id="main">
        {loading && <SkeletonDashboard />}
        {!loading && loadError && (
          <div className="card error-card">
            <span className="empty-icon err"><Icon name="alert-triangle" size={26} /></span>
            <h3>We couldn&rsquo;t load the data</h3>
            <p>{loadError}</p>
            <button type="button" className="btn btn-dark" onClick={refresh}>Try again</button>
          </div>
        )}
        {!loading && !loadError && (
          <>
            {view.tab === "dashboard" && (
              <DashboardTab key={view.nonce} {...common} catalog={catalog} go={go} onOpenStatus={openStatus}
                onExport={() => exportCsv(components, "all-instances")} onOnboard={() => setEditingApp("NEW")} />
            )}
            {["Application", "Database", "OS"].includes(view.tab) && (
              <LayerTab key={`${view.tab}:${view.nonce}`} {...common} type={view.tab} preset={view.preset}
                onEditApp={editByPk} onPlan={planFor} onExport={exportCsv} />
            )}
            {view.tab === "remediation" && (
              <RemediationTab key={view.nonce} {...common} preset={view.preset} onPlan={(app, component) => setPlanTarget({ app, component })} />
            )}
            {view.tab === "catalog" && (
              <CatalogTab catalog={catalog} apps={apps} today={today} isAdmin={isAdmin}
                onAdd={() => setEditingEntry("NEW")} onEdit={setEditingEntry} onDelete={handleDeleteEntry} />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        EOS Command Center &middot; Data as of {fmtDate(today)} &middot; Red and Amber instances need an owner-submitted upgrade plan &middot; Used for the quarterly CTO review
      </footer>

      {top && (
        <Drawer onClose={closeDrawer} escapeActive={!modalOpen} label={top.type === "app" ? "Application detail" : "Status detail"}>
          {top.type === "app" ? (
            <AppDrawerContent app={apps.find((a) => a.id === top.appPk)} today={today} isAdmin={isAdmin}
              canBack={drawer.length > 1} onBack={popDrawer} onClose={closeDrawer}
              onEdit={(app) => setEditingApp(app)} onPlan={(app, component) => setPlanTarget({ app, component })} />
          ) : (
            <StatusDrawerContent status={top.status} apps={apps} today={today}
              canBack={drawer.length > 1} onBack={popDrawer} onClose={closeDrawer} onOpenApp={openApp} />
          )}
        </Drawer>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSubmit={handleLogin} />}
      {editingApp && (
        <AppFormModal app={editingApp === "NEW" ? null : editingApp} catalog={catalog} onClose={() => setEditingApp(null)}
          onSubmit={handleSaveApp}
          onDelete={editingApp !== "NEW" ? async () => { if (await handleDelete(editingApp)) setEditingApp(null); } : undefined} />
      )}
      {planTarget && (
        <UpgradePlanModal app={planTarget.app} component={planTarget.component} onClose={() => setPlanTarget(null)} onSubmit={handleUpdatePlan} />
      )}
      {editingEntry && (
        <CatalogEntryModal entry={editingEntry === "NEW" ? null : editingEntry} onClose={() => setEditingEntry(null)} onSubmit={handleSaveEntry} />
      )}

      <Toasts items={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
