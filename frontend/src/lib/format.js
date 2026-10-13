export const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function initials(name = "") {
  const parts = String(name).replace(/[^A-Za-z\s.]/g, " ").split(/[\s.]+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const AVATARS = [["#ece9fb", "#3f33a6"], ["#e0f2fe", "#075985"], ["#fce7f3", "#9d174d"],
                 ["#dcfce7", "#166534"], ["#fef3c7", "#92400e"], ["#e0e7ff", "#3730a3"]];
export function avatarColors(seed = "") {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATARS[h % AVATARS.length];
}
