const ITEMS = [
  { s: "GREEN", label: "Green", desc: ">18 months to EOS", color: "#2e7d32" },
  { s: "AMBER", label: "Amber", desc: "\u226418 months to EOS", color: "#f9a825" },
  { s: "RED", label: "Red", desc: "EOS reached", color: "#c62828" },
  { s: "BLUE", label: "Blue", desc: "Extended Support purchased", color: "#1565c0" },
];

export default function Legend() {
  return (
    <div className="legend-bar">
      {ITEMS.map((i) => (
        <span key={i.s} className="legend-item">
          <span className="legend-dot" style={{ background: i.color }} />
          <strong>{i.label}</strong>&nbsp;{i.desc}
        </span>
      ))}
    </div>
  );
}
