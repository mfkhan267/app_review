const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Parse "YYYY-MM-DD" as a LOCAL date (new Date("2026-01-01") would be UTC and can shift a day).
export function parseISO(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Accepts a Date or an ISO string.
export const startOfDay = (d = new Date()) => {
  const x = d instanceof Date ? d : parseISO(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

// Whole days from `from` to `to` (negative if `to` is earlier).
export const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / 86400000);

export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());

export function toISO(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function fmtDate(value) {
  const d = parseISO(value);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "\u2014";
}
export function fmtMonthYear(value) {
  const d = parseISO(value);
  return d ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "\u2014";
}
export function fmtMonthShort(value) {
  const d = parseISO(value);
  return d ? `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` : "\u2014";
}

function span(a) {
  if (a < 60) return `${a} day${a === 1 ? "" : "s"}`;
  if (a < 730) return `${Math.round(a / 30.44)} months`;
  return `${(a / 365.25).toFixed(1)} years`;
}
// "in 3 months" / "14 months ago" / "today"
export function relativeText(days) {
  if (days === 0) return "today";
  return days > 0 ? `in ${span(days)}` : `${span(-days)} ago`;
}
