const TABS = [
  { id: "executive", label: "Executive Dashboard" },
  { id: "Application", label: "Applications" },
  { id: "Database", label: "Databases" },
  { id: "OS", label: "Operating Systems" },
  { id: "remediation", label: "Owner Remediation" },
  { id: "catalog", label: "Tech Catalog" },
];

export default function TabNav({ active, onChange, counts }) {
  return (
    <nav className="tab-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab-btn ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {counts?.[t.id] != null && <span className="tab-count">{counts[t.id]}</span>}
        </button>
      ))}
    </nav>
  );
}

export { TABS };
