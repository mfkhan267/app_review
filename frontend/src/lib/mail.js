import { STATUS } from "../constants.js";
import { fmtDate } from "./dates.js";

export function mailto({ to, cc, subject, body }) {
  const q = [`subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(body)}`];
  if (cc) q.push(`cc=${encodeURIComponent(cc)}`);
  return `mailto:${to}?${q.join("&")}`;
}

// items: [{ tech, app, status, end }]. Capped so the mailto URL stays within client limits.
export function reminderBody(ownerName, items) {
  const lines = items.slice(0, 12).map(
    (i) => `- ${i.tech} (${i.app}) \u2014 ${STATUS[i.status].label}, support ${i.pastEnd ? "ended" : "ends"} ${fmtDate(i.end)}`
  );
  if (items.length > 12) lines.push(`- ...and ${items.length - 12} more`);
  return [
    `Hi ${ownerName},`,
    "",
    "The following technology instances you own are past, or approaching, End of Support and need an upgrade plan:",
    "",
    ...lines,
    "",
    "Please submit your upgrade plan and target date in the EOS Command Center ahead of the quarterly review.",
    "",
    "Thank you",
  ].join("\n");
}
