import { Cell, Pie, PieChart } from "recharts";

const COLORS = { GREEN: "#2e7d32", AMBER: "#f9a825", RED: "#c62828", BLUE: "#1565c0" };
const ORDER = ["RED", "AMBER", "GREEN", "BLUE"];

export default function StatusDonut({ byStatus }) {
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1;
  const data = ORDER.map((s) => ({ name: s, value: byStatus[s] || 0 }));
  const greenPct = Math.round(((byStatus.GREEN || 0) / total) * 100);

  return (
    <div>
      <div className="donut-wrap">
        <PieChart width={240} height={240}>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={72}
            outerRadius={102}
            startAngle={90}
            endAngle={-270}
            stroke="#fff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={COLORS[d.name]} />
            ))}
          </Pie>
        </PieChart>
        <div className="donut-center">
          <div className="donut-pct">{greenPct}%</div>
          <div className="donut-pct-label">GREEN</div>
        </div>
      </div>

      {/* Static side-by-side breakdown instead of a hover tooltip, so every
          status's share is visible at once with nothing overlapping. */}
      <div className="donut-stats-row">
        {ORDER.map((s) => {
          const count = byStatus[s] || 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={s} className="donut-stat-item">
              <span className="legend-dot" style={{ background: COLORS[s] }} />
              <div>
                <div className="donut-stat-pct">{pct}%</div>
                <div className="hint-text">{s} ({count})</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
