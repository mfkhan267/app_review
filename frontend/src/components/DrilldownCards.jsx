const LABELS = {
  Application: { title: "Applications", desc: "Runtimes, frameworks, languages" },
  Database: { title: "Databases", desc: "Database engines and versions" },
  OS: { title: "Operating Systems", desc: "Server and platform OS versions" },
};

export default function DrilldownCards({ byType, onOpen }) {
  return (
    <div className="drilldown-grid">
      {Object.keys(LABELS).map((type) => {
        const counts = byType[type] || { GREEN: 0, AMBER: 0, RED: 0, BLUE: 0, total: 0 };
        return (
          <button key={type} className="drilldown-card" onClick={() => onOpen(type)}>
            <div className="drilldown-title">{LABELS[type].title}</div>
            <div className="hint-text">{counts.total} technology instance{counts.total === 1 ? "" : "s"}</div>
            <div className="drilldown-badges">
              <span className="mini-badge GREEN">GREEN {counts.GREEN}</span>
              <span className="mini-badge AMBER">AMBER {counts.AMBER}</span>
              <span className="mini-badge RED">RED {counts.RED}</span>
              <span className="mini-badge BLUE">BLUE {counts.BLUE}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
