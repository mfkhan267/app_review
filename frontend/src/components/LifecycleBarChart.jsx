import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ZONE_COLOR = { RED: "#c62828", AMBER: "#f9a825", GREEN: "#2e7d32" };

export default function LifecycleBarChart({ buckets }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={buckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(v) => [`${v} component(s)`, "Reaching EOS"]} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {buckets.map((b) => (
            <Cell key={b.key} fill={ZONE_COLOR[b.zone]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
