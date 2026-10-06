import { useState } from "react";

const EMPTY_APP = {
  app_id: "", app_name: "", platform: "Web",
  app_owner: "", app_owner_email: "", platform_owner: "", platform_owner_email: "",
};

const EMPTY_COMPONENT = {
  component_type: "Application", catalog_id: "", tech_name: "", version: "",
  eol_date: "", extended_support_date: "",
};

function findCatalogMatch(catalog, c) {
  return catalog.find(
    (e) => e.component_type === c.component_type && e.tech_name === c.tech_name && e.version === c.version
  );
}

function toFormComponents(components, catalog) {
  if (!components || !components.length) return [{ ...EMPTY_COMPONENT }];
  return components.map((c) => {
    const match = findCatalogMatch(catalog, c);
    return {
      component_type: c.component_type,
      catalog_id: match ? String(match.id) : "",
      tech_name: c.tech_name,
      version: c.version || "",
      eol_date: c.eol_date || "",
      extended_support_date: c.extended_support_date || "",
    };
  });
}

export default function AppFormModal({ app, catalog, onClose, onSubmit, onDelete }) {
  const isEdit = Boolean(app);
  const [form, setForm] = useState(app ? { ...EMPTY_APP, ...app } : EMPTY_APP);
  const [components, setComponents] = useState(toFormComponents(app?.components, catalog));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const field = (name) => ({
    value: form[name] ?? "",
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
  });

  const updateComponent = (idx, name, value) => {
    setComponents((list) => list.map((c, i) => (i === idx ? { ...c, [name]: value } : c)));
  };

  const selectComponentType = (idx, type) => {
    // Changing the layer invalidates any catalog pick from the old layer's list.
    setComponents((list) =>
      list.map((c, i) => (i === idx ? { ...c, component_type: type, catalog_id: "" } : c))
    );
  };

  const selectCatalog = (idx, catalogId) => {
    if (!catalogId) {
      setComponents((list) => list.map((c, i) => (i === idx ? { ...c, catalog_id: "" } : c)));
      return;
    }
    const entry = catalog.find((e) => String(e.id) === catalogId);
    if (!entry) return;
    setComponents((list) =>
      list.map((c, i) =>
        i === idx
          ? {
              ...c,
              catalog_id: catalogId,
              tech_name: entry.tech_name,
              version: entry.version,
              eol_date: entry.eoss_date,
              extended_support_date: entry.eoes_date || "",
            }
          : c
      )
    );
  };

  const addComponent = () => setComponents((list) => [...list, { ...EMPTY_COMPONENT }]);
  const removeComponent = (idx) =>
    setComponents((list) => (list.length > 1 ? list.filter((_, i) => i !== idx) : list));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        platform_owner_email: form.platform_owner_email || null,
        components: components.map(({ catalog_id, ...c }) => ({
          ...c,
          version: c.version || null,
          extended_support_date: c.extended_support_date || null,
        })),
      };
      await onSubmit(payload, app?.id);
      onClose();
    } catch (err) {
      setError(err.message || "Could not save application");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? `Edit ${app.app_id}` : "Onboard new application"}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field">
                <label>App ID</label>
                <input {...field("app_id")} required disabled={isEdit} placeholder="APP-006" />
              </div>
              <div className="field">
                <label>App name</label>
                <input {...field("app_name")} required />
              </div>

              <div className="field">
                <label>Platform</label>
                <select {...field("platform")} required>
                  <option value="Web">Web</option>
                  <option value="App">App</option>
                  <option value="Database">Database</option>
                </select>
              </div>
              <div className="field" />

              <div className="field">
                <label>App owner</label>
                <input {...field("app_owner")} required />
              </div>
              <div className="field">
                <label>App owner email</label>
                <input type="email" {...field("app_owner_email")} required />
              </div>

              <div className="field">
                <label>Platform owner</label>
                <input {...field("platform_owner")} required />
              </div>
              <div className="field">
                <label>Platform owner email</label>
                <input type="email" {...field("platform_owner_email")} />
              </div>
            </div>

            <h3 className="section-title" style={{ marginTop: 20, marginBottom: 10 }}>
              Technology components
            </h3>
            {isEdit && (
              <div className="hint-text" style={{ marginBottom: 10 }}>
                Saving will replace the full component list below. Any upgrade plan already
                recorded on a removed or edited component will need to be re-entered.
              </div>
            )}

            {components.map((c, idx) => {
              const options = catalog.filter((e) => e.component_type === c.component_type);
              const fromCatalog = Boolean(c.catalog_id);
              return (
                <div
                  key={idx}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 10 }}
                >
                  <div className="form-grid">
                    <div className="field">
                      <label>Component layer</label>
                      <select
                        value={c.component_type}
                        onChange={(e) => selectComponentType(idx, e.target.value)}
                      >
                        <option value="Application">Application</option>
                        <option value="Database">Database</option>
                        <option value="OS">OS</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Technology (approved catalog)</label>
                      <select value={c.catalog_id} onChange={(e) => selectCatalog(idx, e.target.value)}>
                        <option value="">Custom / not in catalog</option>
                        {options.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.tech_name} {o.version} (EOSS {o.eoss_date})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label>Technology name</label>
                      <input
                        value={c.tech_name}
                        onChange={(e) => updateComponent(idx, "tech_name", e.target.value)}
                        required
                        disabled={fromCatalog}
                        placeholder="e.g. Java, PostgreSQL, RHEL"
                      />
                    </div>
                    <div className="field">
                      <label>Version</label>
                      <input
                        value={c.version}
                        onChange={(e) => updateComponent(idx, "version", e.target.value)}
                        disabled={fromCatalog}
                        placeholder="e.g. 11, 14, 8"
                      />
                    </div>
                    <div className="field">
                      <label>End of Support {fromCatalog && "(EOSS)"}</label>
                      <input
                        type="date"
                        value={c.eol_date}
                        onChange={(e) => updateComponent(idx, "eol_date", e.target.value)}
                        required
                        disabled={fromCatalog}
                      />
                    </div>
                    <div className="field">
                      <label>Extended Support until {fromCatalog && "(EOES)"}</label>
                      <input
                        type="date"
                        value={c.extended_support_date}
                        onChange={(e) => updateComponent(idx, "extended_support_date", e.target.value)}
                        disabled={fromCatalog}
                      />
                    </div>
                    {fromCatalog && (
                      <div className="field full hint-text" style={{ marginTop: -6 }}>
                        Dates are populated from the Technology Catalog. Pick "Custom" above to override.
                      </div>
                    )}
                    <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={components.length === 1}
                        onClick={() => removeComponent(idx)}
                      >
                        Remove component
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button type="button" className="btn btn-outline btn-sm" onClick={addComponent}>
              + Add component
            </button>

            {error && <div className="error-text" style={{ marginTop: 14 }}>{error}</div>}
          </div>
          <div className="modal-footer" style={{ justifyContent: onDelete ? "space-between" : "flex-end" }}>
            {onDelete && (
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                Delete application
              </button>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Saving..." : isEdit ? "Save changes" : "Add application"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
