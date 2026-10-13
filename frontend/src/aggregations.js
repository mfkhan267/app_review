// Pure helpers that turn apps[] (each with nested components[]) into the shapes the
// views need. Everything is derived from real data: no invented trends or deltas.
import { LAYERS, STATUS_ORDER } from "./constants.js";
import { addMonths, daysBetween, parseISO, startOfDay } from "./lib/dates.js";
import { pct } from "./lib/format.js";

const severity = (s) => STATUS_ORDER.indexOf(s);
export const worstStatus = (statuses) =>
  statuses.reduce((w, s) => (w === null || severity(s) < severity(w) ? s : w), null);

export const techLabel = (c) => `${c.tech_name}${c.version ? ` ${c.version}` : ""}`;
export const isAtRisk = (c) => c.status === "RED" || c.status === "AMBER";

// The date support REALLY ends: the extended date if one extends past standard support.
// Mirrors backend compute_status (a component turns RED once it is past this date).
export function supportEnd(c) {
  const eol = parseISO(c.eol_date);
  const ext = parseISO(c.extended_support_date);
  return ext && eol && ext > eol ? ext : eol;
}

export function allComponents(apps) {
  return apps.flatMap((a) =>
    a.components.map((c) => ({
      ...c,
      app_id: a.app_id, app_name: a.app_name, platform: a.platform,
      app_owner: a.app_owner, app_owner_email: a.app_owner_email,
      platform_owner: a.platform_owner, platform_owner_email: a.platform_owner_email,
      _appPk: a.id,
      supportEnd: supportEnd(c),
    }))
  );
}

export function byStatus(components) {
  const counts = { GREEN: 0, AMBER: 0, RED: 0, BLUE: 0 };
  for (const c of components) counts[c.status] = (counts[c.status] || 0) + 1;
  return counts;
}

export function layerHealth(components) {
  return LAYERS.map((layer) => {
    const rows = components.filter((c) => c.component_type === layer);
    const counts = byStatus(rows);
    const total = rows.length;
    return {
      layer, total, counts,
      supported: total - counts.RED,
      supportedPct: total ? pct(total - counts.RED, total) : null,
    };
  });
}

// A plan only counts as "overdue" while the instance is still at risk.
export function isOverdue(c, today = startOfDay()) {
  if (!isAtRisk(c) || !c.upgrade_plan) return false;
  const t = parseISO(c.upgrade_target_date);
  return !!t && t < today;
}

export function planStats(components, today = startOfDay()) {
  const risk = components.filter(isAtRisk);
  const withPlan = risk.filter((c) => c.upgrade_plan);
  return {
    atRisk: risk.length,
    withPlan: withPlan.length,
    missing: risk.length - withPlan.length,
    overdue: risk.filter((c) => isOverdue(c, today)).length,
  };
}

// Instances by the quarter their support really ends, split by layer.
export function lifecycleByQuarter(components, today = startOfDay(), quarters = 8) {
  const q0 = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
  const mk = (key, label, extra = {}) => ({
    key, label, counts: { Application: 0, Database: 0, OS: 0 }, total: 0, names: [], ...extra,
  });
  const buckets = [mk("past", "Past", { past: true })];
  for (let i = 0; i < quarters; i++) {
    const d = addMonths(q0, i * 3);
    buckets.push(mk(`q${i}`, `Q${Math.floor(d.getMonth() / 3) + 1} '${String(d.getFullYear()).slice(2)}`));
  }
  buckets.push(mk("later", "Later"));

  for (const c of components) {
    const end = c.supportEnd ?? supportEnd(c);
    let idx;
    if (end < today) idx = 0;
    else {
      const months = (end.getFullYear() - q0.getFullYear()) * 12 + (end.getMonth() - q0.getMonth());
      const qi = Math.floor(months / 3);
      idx = qi >= quarters ? buckets.length - 1 : 1 + qi;
    }
    const b = buckets[idx];
    b.counts[c.component_type] = (b.counts[c.component_type] || 0) + 1;
    b.total++;
    b.names.push(techLabel(c));
  }
  return buckets;
}

// How many instances are unsupported at each month over the next `months` months:
//  - noAction:  nothing changes, instances simply run past their support end
//  - withPlans: instances whose submitted plan has a FUTURE target date drop out on that date
// A plan whose target date has already passed is NOT credited (the instance is still on the old version).
export function exposureForecast(components, today = startOfDay(), months = 24) {
  const total = components.length;
  const endOf = (c) => c.supportEnd ?? supportEnd(c);
  const unsupportedAt = (c, d) => d > endOf(c);
  const resolvedAt = (c, d) => {
    if (!c.upgrade_plan) return false;
    const t = parseISO(c.upgrade_target_date);
    return !!t && t > today && t <= d;
  };
  const points = [];
  let prev = null;
  for (let i = 0; i <= months; i++) {
    const date = i === 0 ? today : new Date(today.getFullYear(), today.getMonth() + i, 1);
    let noAction = 0, withPlans = 0;
    const newly = [];
    for (const c of components) {
      const out = unsupportedAt(c, date);
      if (out) {
        noAction++;
        if (!resolvedAt(c, date)) withPlans++;
      }
      if (prev && out && !unsupportedAt(c, prev)) newly.push(c);
    }
    points.push({ i, date, noAction, withPlans, total, newly });
    prev = date;
  }
  return points;
}

export function needsAttention(components, today = startOfDay(), limit = 6) {
  return components
    .filter(isAtRisk)
    .map((c) => ({
      component: c,
      days: daysBetween(today, c.supportEnd ?? supportEnd(c)),
      hasPlan: !!c.upgrade_plan,
      overdue: isOverdue(c, today),
    }))
    .sort((a, b) =>
      severity(a.component.status) - severity(b.component.status) ||
      Number(a.hasPlan) - Number(b.hasPlan) ||
      a.days - b.days)
    .slice(0, limit);
}

export function techExposure(components, limit = 7) {
  const map = new Map();
  for (const c of components) {
    const key = `${c.component_type}|${c.tech_name}|${c.version || ""}`;
    const g = map.get(key) ?? { key, type: c.component_type, name: techLabel(c), count: 0, apps: new Set(), statuses: [] };
    g.count++;
    g.apps.add(c.app_id);
    g.statuses.push(c.status);
    map.set(key, g);
  }
  return [...map.values()]
    .map((g) => ({ key: g.key, type: g.type, name: g.name, count: g.count, appCount: g.apps.size, worst: worstStatus(g.statuses) }))
    .sort((a, b) => b.count - a.count || severity(a.worst) - severity(b.worst) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

const catKey = (type, tech, ver) => `${type}|${tech}|${ver || ""}`;
const inSync = (c, e) => c.eol_date === e.eoss_date && (c.extended_support_date || null) === (e.eoes_date || null);

// How well the estate lines up with the approved Technology Catalog (the source of truth for dates).
export function catalogAlignment(components, catalog) {
  const byKey = new Map(catalog.map((e) => [catKey(e.component_type, e.tech_name, e.version), e]));
  let covered = 0, synced = 0;
  const drift = [];
  for (const c of components) {
    const e = byKey.get(catKey(c.component_type, c.tech_name, c.version));
    if (!e) continue;
    covered++;
    if (inSync(c, e)) synced++; else drift.push({ component: c, entry: e });
  }
  const total = components.length;
  return { total, covered, coveredPct: pct(covered, total), synced, syncedPct: pct(synced, total), drift };
}

export function catalogUsage(components, catalog) {
  const usage = new Map(catalog.map((e) => [e.id, { count: 0, drift: 0 }]));
  const byKey = new Map(catalog.map((e) => [catKey(e.component_type, e.tech_name, e.version), e]));
  for (const c of components) {
    const e = byKey.get(catKey(c.component_type, c.tech_name, c.version));
    if (!e) continue;
    const u = usage.get(e.id);
    u.count++;
    if (!inSync(c, e)) u.drift++;
  }
  return usage;
}

export function ownerGroups(apps, today = startOfDay()) {
  const groups = new Map();
  for (const a of apps) {
    for (const c of a.components) {
      if (!isAtRisk(c)) continue;
      const key = (a.app_owner_email || a.app_owner).toLowerCase();
      const g = groups.get(key) ?? { key, owner: a.app_owner, email: a.app_owner_email, items: [] };
      const end = supportEnd(c);
      g.items.push({
        app: a, component: { ...c, supportEnd: end },
        days: daysBetween(today, end), hasPlan: !!c.upgrade_plan, overdue: isOverdue(c, today),
      });
      groups.set(key, g);
    }
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      items: g.items.sort((a, b) => severity(a.component.status) - severity(b.component.status) || a.days - b.days),
      withPlan: g.items.filter((i) => i.hasPlan).length,
      missing: g.items.filter((i) => !i.hasPlan).length,
      overdue: g.items.filter((i) => i.overdue).length,
    }))
    .sort((a, b) => b.missing - a.missing || b.items.length - a.items.length || a.owner.localeCompare(b.owner));
}

export function statusItems(components, status) {
  return components
    .filter((c) => c.status === status)
    .sort((a, b) => (a.supportEnd ?? supportEnd(a)) - (b.supportEnd ?? supportEnd(b)));
}

export function searchAll(apps, q, limit = 5) {
  const needle = q.trim().toLowerCase();
  if (!needle) return { apps: [], techs: [] };
  const hits = apps
    .filter((a) => `${a.app_id} ${a.app_name} ${a.app_owner} ${a.platform_owner}`.toLowerCase().includes(needle))
    .slice(0, limit);
  const techs = techExposure(allComponents(apps), 9999).filter((t) => t.name.toLowerCase().includes(needle)).slice(0, 3);
  return { apps: hits, techs };
}
