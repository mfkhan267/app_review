// Pure helpers that turn the raw apps[] (each with nested components[]) into
// the shapes each dashboard view needs. Computed client-side since the
// dataset is small (tens to low hundreds of rows) - no extra API calls.

export function allComponents(apps) {
  return apps.flatMap((a) =>
    a.components.map((c) => ({ ...c, app_id: a.app_id, app_name: a.app_name, app_owner: a.app_owner,
      app_owner_email: a.app_owner_email, platform_owner: a.platform_owner,
      platform_owner_email: a.platform_owner_email, platform: a.platform, _appPk: a.id }))
  );
}

export function byStatus(components) {
  const counts = { GREEN: 0, AMBER: 0, RED: 0, BLUE: 0 };
  for (const c of components) counts[c.status] = (counts[c.status] || 0) + 1;
  return counts;
}

export function byType(components) {
  const out = {};
  for (const c of components) {
    out[c.component_type] ??= { GREEN: 0, AMBER: 0, RED: 0, BLUE: 0, total: 0 };
    out[c.component_type][c.status]++;
    out[c.component_type].total++;
  }
  return out;
}

const QUARTER_MS = 1000 * 60 * 60 * 24 * 91;

export function lifecycleBuckets(components, today = new Date()) {
  const buckets = [{ key: "past", label: "Past", zone: "RED", count: 0 }];
  for (let i = 0; i < 8; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i * 3, 1);
    const q = Math.floor(d.getMonth() / 3) + 1;
    buckets.push({ key: `${d.getFullYear()}-Q${q}`, label: `Q${q} '${String(d.getFullYear()).slice(2)}`,
      zone: i < 6 ? "AMBER" : "GREEN", count: 0, start: d });
  }
  buckets.push({ key: "beyond", label: "Beyond", zone: "GREEN", count: 0 });

  const horizonEnd = new Date(today.getFullYear(), today.getMonth() + 24, 1);
  for (const c of components) {
    const eol = new Date(c.eol_date);
    if (eol < today) {
      buckets[0].count++;
      continue;
    }
    if (eol >= horizonEnd) {
      buckets[buckets.length - 1].count++;
      continue;
    }
    const monthsOut = (eol.getFullYear() - today.getFullYear()) * 12 + (eol.getMonth() - today.getMonth());
    const idx = Math.min(1 + Math.floor(monthsOut / 3), buckets.length - 2);
    buckets[idx].count++;
  }
  return buckets;
}

export function techExposure(components, limit = 8) {
  const counts = new Map();
  for (const c of components) {
    const key = `${c.tech_name}${c.version ? " " + c.version : ""}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function ownerGroups(apps) {
  const groups = new Map();
  for (const a of apps) {
    for (const c of a.components) {
      if (c.status !== "RED" && c.status !== "AMBER") continue;
      const key = a.app_owner_email || a.app_owner;
      if (!groups.has(key)) {
        groups.set(key, { owner: a.app_owner, email: a.app_owner_email, items: [] });
      }
      groups.get(key).items.push({ app: a, component: c });
    }
  }
  return [...groups.values()].sort((a, b) => b.items.length - a.items.length);
}
