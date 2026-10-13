// Pure SVG geometry helpers (no DOM, no React) so they can be unit-tested.

const rad = (deg) => (deg * Math.PI) / 180;

// 0deg = 12 o'clock, clockwise.
export function polar(cx, cy, r, deg) {
  const a = rad(deg - 90);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// Segments for a ring with visible gaps and round caps.
// round caps extend `stroke/2` past each arc end, so trim that off plus half the gap.
export function ringSegments(items, { r, stroke, gapDeg = 8 }) {
  const total = items.reduce((n, i) => n + i.value, 0);
  if (!total) return [];
  const present = items.filter((i) => i.value > 0);
  const capDeg = ((stroke / 2) / r) * (180 / Math.PI);
  let cursor = 0;
  return present.map((i) => {
    const sweep = (i.value / total) * 360;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    const mid = (start + end) / 2;
    if (present.length === 1) return { ...i, pct: 1, startDeg: 0, endDeg: 359.99, midDeg: mid, full: true };
    const trim = gapDeg / 2 + capDeg;
    let a = start + trim;
    let b = end - trim;
    if (b - a < 0.5) { a = mid - 0.25; b = mid + 0.25; } // tiny segment: render as a dot
    return { ...i, pct: i.value / total, startDeg: a, endDeg: b, midDeg: mid, full: false };
  });
}

// Smooth monotone cubic path (Fritsch-Carlson): no overshoot between data points.
export function monotonePath(pts) {
  const n = pts.length;
  if (n === 0) return "";
  const f = (v) => +v.toFixed(2);
  if (n === 1) return `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  const dx = [], m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    m[i] = dx[i] === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx[i];
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const tau = 3 / Math.sqrt(s); t[i] = tau * a * m[i]; t[i + 1] = tau * b * m[i]; }
  }
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i];
    d += ` C ${f(pts[i].x + h / 3)} ${f(pts[i].y + (t[i] * h) / 3)}, ${f(pts[i + 1].x - h / 3)} ${f(pts[i + 1].y - (t[i + 1] * h) / 3)}, ${f(pts[i + 1].x)} ${f(pts[i + 1].y)}`;
  }
  return d;
}

// Round-number axis: returns { max, ticks, step }. `integer` keeps ticks whole numbers (for counts).
export function niceScale(maxVal, maxTicks = 4, integer = false) {
  const raw = Math.max(maxVal, 1);
  let mag = Math.pow(10, Math.floor(Math.log10(raw / maxTicks)));
  if (integer) mag = Math.max(1, mag);
  const steps = [1, 2, 2.5, 5, 10].map((s) => s * mag).filter((s) => !integer || s % 1 === 0);
  const step = steps.find((s) => raw / s <= maxTicks) ?? steps[steps.length - 1];
  const max = Math.ceil(raw / step) * step;
  const ticks = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(6));
  return { max, ticks, step };
}
