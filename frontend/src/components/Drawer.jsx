import { worstStatus, allComponents, isAtRisk, isOverdue, statusItems, supportEnd, techLabel } from "../aggregations.js";
import { LAYER, LAYERS, STATUS } from "../constants.js";
import { useEscapeKey } from "../hooks.js";
import { daysBetween, fmtDate, fmtMonthYear, parseISO, relativeText } from "../lib/dates.js";
import { mailto, reminderBody } from "../lib/mail.js";
import { AttentionList } from "./AttentionRail.jsx";
import Icon from "./Icon.jsx";
import { Avatar, StatusPill } from "./ui.jsx";

export function Drawer({ onClose, escapeActive, children, label }) {
  useEscapeKey(onClose, escapeActive);
  return (
    <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={label}>{children}</aside>
    </div>
  );
}

// Where "today" sits relative to standard (EOSS) and extended (EOES) support end.
function Timeline({ c, today }) {
  const eol = parseISO(c.eol_date);
  const ext = parseISO(c.extended_support_date);
  const hasExt = !!ext && ext > eol;
  const dates = [today, eol, ...(hasExt ? [ext] : [])];
  const lo = Math.min(...dates), hi = Math.max(...dates);
  const pad = Math.max(45 * 86400000, (hi - lo) * 0.14);
  const a = lo - pad, b = hi + pad;
  const pos = (d) => `${(((+d) - a) / (b - a)) * 100}%`;
  const width = (d1, d2) => `${(((+d2) - (+d1)) / (b - a)) * 100}%`;
  return (
    <div className="tl" aria-hidden="true">
      <div className="tl-track">
        <div className="tl-past" style={{ width: pos(today) }} />
        {hasExt && <div className="tl-ext" style={{ left: pos(eol), width: width(eol, ext) }} />}
        <span className="tl-mark eoss" style={{ left: pos(eol) }} />
        {hasExt && <span className="tl-mark eoes" style={{ left: pos(ext) }} />}
        <span className="tl-mark today" style={{ left: pos(today) }} />
      </div>
      <div className="tl-labels">
        <span className="tl-label up" style={{ left: pos(today) }}>Today</span>
        <span className="tl-label" style={{ left: pos(eol) }}>EOSS {fmtMonthYear(eol)}</span>
        {hasExt && <span className="tl-label" style={{ left: pos(ext) }}>EOES {fmtMonthYear(ext)}</span>}
      </div>
    </div>
  );
}

function ComponentCard({ c, today, isAdmin, onPlan }) {
  const end = supportEnd(c);
  const days = daysBetween(today, end);
  const risk = isAtRisk(c);
  const overdue = isOverdue(c, today);
  return (
    <div className="comp-card">
      <div className="comp-head">
        <span className="comp-icon"><Icon name={LAYER[c.component_type].icon} size={18} /></span>
        <div className="comp-title"><strong>{techLabel(c)}</strong><small>{LAYER[c.component_type].singular}</small></div>
        <StatusPill status={c.status} />
      </div>
      <p className="comp-when">
        {days < 0 ? "Support ended" : "Support ends"} <b>{fmtDate(end)}</b>
        <span className={days < 0 ? "neg" : ""}> &middot; {relativeText(days)}</span>
      </p>
      <Timeline c={c} today={today} />
      <div className="comp-plan">
        {c.upgrade_plan ? (
          <>
            <div className="comp-plan-label"><Icon name="flag" size={13} /> Upgrade plan{overdue && <span className="tag red">Overdue</span>}</div>
            <p>{c.upgrade_plan}</p>
            <small>{c.upgrade_target_date ? `Target ${fmtDate(c.upgrade_target_date)}` : "No target date set"}</small>
          </>
        ) : risk ? (
          <div className="comp-plan-label warn"><Icon name="alert-triangle" size={13} /> No upgrade plan submitted</div>
        ) : (
          <div className="comp-plan-label ok"><Icon name="check-circle" size={13} /> No action needed</div>
        )}
        {isAdmin && risk && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onPlan(c)}>{c.upgrade_plan ? "Update plan" : "Submit plan"}</button>
        )}
      </div>
    </div>
  );
}

function OwnerCard({ role, name, email }) {
  return (
    <div className="owner-mini">
      <Avatar name={name} size={40} />
      <div><small>{role}</small><strong>{name}</strong>{email ? <a href={`mailto:${email}`}>{email}</a> : <span className="muted">No email on file</span>}</div>
    </div>
  );
}

export function AppDrawerContent({ app, today, isAdmin, canBack, onBack, onClose, onEdit, onPlan }) {
  if (!app) return <div className="drawer-body"><p className="muted-note">This application is no longer available.</p></div>;
  const worst = worstStatus(app.components.map((c) => c.status));
  const chase = app.components.filter((c) => isAtRisk(c) && (!c.upgrade_plan || isOverdue(c, today)));
  const href = mailto({
    to: app.app_owner_email,
    cc: app.platform_owner_email || undefined,
    subject: chase.length ? `[Action required] Upgrade plan needed: ${app.app_name} (${app.app_id})` : `EOS review: ${app.app_name} (${app.app_id})`,
    body: chase.length
      ? reminderBody(app.app_owner, chase.map((c) => ({ tech: techLabel(c), app: `${app.app_name}, ${app.app_id}`, status: c.status, end: supportEnd(c), pastEnd: daysBetween(today, supportEnd(c)) < 0 })))
      : `Hi ${app.app_owner},\n\nA quick check-in on ${app.app_name} (${app.app_id}) ahead of the quarterly End of Support review.\n\nThank you`,
  });
  const comps = app.components.slice().sort((a, b) => STATUS_RANK(a.status) - STATUS_RANK(b.status));

  return (
    <>
      <header className="drawer-head">
        {canBack && <button type="button" className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="arrow-left" size={18} /></button>}
        <div className="drawer-title">
          <div className="eyebrow">{app.app_id} &middot; {app.platform}</div>
          <h2>{app.app_name}</h2>
        </div>
        {worst && <StatusPill status={worst} />}
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
      </header>
      <div className="drawer-body">
        <section>
          <h4 className="drawer-h">Owners</h4>
          <div className="owner-pair">
            <OwnerCard role="Application owner" name={app.app_owner} email={app.app_owner_email} />
            <OwnerCard role="Platform owner" name={app.platform_owner} email={app.platform_owner_email} />
          </div>
        </section>
        <section>
          <h4 className="drawer-h">Technology components <span>{app.components.length}</span></h4>
          {comps.map((c) => <ComponentCard key={c.id} c={c} today={today} isAdmin={isAdmin} onPlan={(comp) => onPlan(app, comp)} />)}
        </section>
      </div>
      <footer className="drawer-foot">
        <a className="btn btn-dark" href={href}><Icon name="mail" size={16} /> {chase.length ? "Email for upgrade plan" : "Email owner"}</a>
        {isAdmin && <button type="button" className="btn btn-outline" onClick={() => onEdit(app)}><Icon name="edit" size={16} /> Edit application</button>}
      </footer>
    </>
  );
}

const STATUS_RANK = (s) => ["RED", "AMBER", "BLUE", "GREEN"].indexOf(s);

export function StatusDrawerContent({ status, apps, today, onBack, canBack, onClose, onOpenApp }) {
  const all = allComponents(apps);
  const rows = statusItems(all, status);
  const meta = STATUS[status];
  const items = rows.map((c) => ({
    component: c, days: daysBetween(today, c.supportEnd), hasPlan: !!c.upgrade_plan, overdue: isOverdue(c, today),
  }));
  return (
    <>
      <header className="drawer-head">
        {canBack && <button type="button" className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="arrow-left" size={18} /></button>}
        <div className="drawer-title">
          <div className="eyebrow">{meta.desc}</div>
          <h2>{meta.label} &middot; {rows.length} instance{rows.length === 1 ? "" : "s"}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
      </header>
      <div className="drawer-body">
        {rows.length === 0 && <p className="muted-note">No instances have this status.</p>}
        {LAYERS.map((layer) => {
          const group = items.filter((i) => i.component.component_type === layer);
          if (!group.length) return null;
          return (
            <section key={layer}>
              <h4 className="drawer-h"><Icon name={LAYER[layer].icon} size={14} /> {LAYER[layer].label} <span>{group.length}</span></h4>
              <AttentionList items={group} onOpenApp={onOpenApp} />
            </section>
          );
        })}
      </div>
    </>
  );
}
