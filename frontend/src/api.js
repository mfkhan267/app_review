const BASE = "/api";

async function request(path, { method = "GET", body, token, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (password) => request("/auth/login", { method: "POST", body: { password } }),
  listApps: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    const suffix = qs.toString() ? `?${qs}` : "";
    return request(`/apps${suffix}`);
  },
  summary: () => request("/summary"),
  createApp: (token, body) => request("/apps", { method: "POST", body, token }),
  updateApp: (token, id, body) => request(`/apps/${id}`, { method: "PUT", body, token }),
  updateUpgradePlan: (token, componentId, body) =>
    request(`/components/${componentId}/upgrade-plan`, { method: "PATCH", body, token }),
  deleteApp: (token, id) => request(`/apps/${id}`, { method: "DELETE", token }),
  importExcel: (token, file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/apps/import", { method: "POST", body: form, token, isForm: true });
  },

  listCatalog: (componentType) =>
    request(`/catalog${componentType ? `?component_type=${componentType}` : ""}`),
  createCatalogEntry: (token, body) => request("/catalog", { method: "POST", body, token }),
  updateCatalogEntry: (token, id, body) => request(`/catalog/${id}`, { method: "PUT", body, token }),
  deleteCatalogEntry: (token, id) => request(`/catalog/${id}`, { method: "DELETE", token }),
};
