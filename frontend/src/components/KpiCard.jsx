import Icon from "./Icon.jsx";

// When onOpen is provided the whole card is the control (big touch target); the arrow is a visual hint.
export default function KpiCard({ icon, tone, tint, label, value, chip, caption, onOpen, openLabel }) {
  const key = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } };
  const interactive = onOpen ? { role: "button", tabIndex: 0, onClick: onOpen, onKeyDown: key, "aria-label": `${openLabel || label}: ${value}` } : {};
  return (
    <article className={`kpi${onOpen ? " clickable" : ""}`} style={{ "--tone": tone, "--tint": tint }} {...interactive}>
      <div className="kpi-top">
        <span className="kpi-badge"><Icon name={icon} size={22} /></span>
        <span className="kpi-label">{label}</span>
        {onOpen && <span className="icon-btn kpi-open" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span>}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        <span>{caption}</span>
        {chip && <span className="kpi-chip">{chip}</span>}
      </div>
    </article>
  );
}
