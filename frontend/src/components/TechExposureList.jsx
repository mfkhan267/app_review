export default function TechExposureList({ items }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="exposure-list">
      {items.map((i) => (
        <div key={i.name} className="exposure-row">
          <div className="exposure-name">{i.name}</div>
          <div className="exposure-bar-track">
            <div className="exposure-bar-fill" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
          <div className="exposure-count">{i.count}</div>
        </div>
      ))}
    </div>
  );
}
