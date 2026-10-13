import { STATUS } from "../constants.js";
import { avatarColors, initials } from "../lib/format.js";
import Icon from "./Icon.jsx";

export function StatusPill({ status, label, compact = false }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span className={`status-pill${compact ? " compact" : ""}`} style={{ background: s.tint, color: s.ink }} title={s.desc}>
      <span className="dot" style={{ background: s.color }} />
      {label ?? s.label}
    </span>
  );
}

export function Avatar({ name, size = 32 }) {
  const [bg, fg] = avatarColors(name);
  return (
    <span className="avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

// Compact toggle, e.g. count vs percent.
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)} title={o.title}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function HatchBar({ pct, color, delay = 0 }) {
  return (
    <div className="hatch-track">
      <div className="hatch-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, "--c": color, animationDelay: `${delay}ms` }} />
    </div>
  );
}

export function EmptyState({ icon = "layers", title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name={icon} size={26} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Toasts({ items, onDismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <Icon name={t.tone === "error" ? "alert-triangle" : "check-circle"} size={18} />
          <span>{t.message}</span>
          <button type="button" className="toast-x" onClick={() => onDismiss(t.id)} aria-label="Dismiss"><Icon name="x" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="kpi-grid">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 168, borderRadius: 28 }} />)}</div>
      <div className="grid-2"><div className="skeleton" style={{ height: 420, borderRadius: 28 }} /><div className="skeleton" style={{ height: 420, borderRadius: 28 }} /></div>
    </div>
  );
}

// Pill filter row. options: [{ value, label, count, color }]
export function FilterChips({ options, value, onChange, label }) {
  return (
    <div className="chip-row" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} className={`chip${value === o.value ? " on" : ""}`}
          onClick={() => onChange(o.value)}>
          {o.color && <span className="dot" style={{ background: o.color }} />}
          {o.label}
          {o.count != null && <b>{o.count}</b>}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
