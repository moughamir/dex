/**
 * Date/time formatting helpers. Deterministic (no locale-dependent output)
 * so tests and SSR are stable.
 */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Relative time from an epoch-ms timestamp: "just now", "5m ago", "2h ago". */
export function timeAgo(timestampMs: number): string {
  const diff = Date.now() - timestampMs;
  if (!Number.isFinite(diff) || diff < 0) return "just now";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Alias of `timeAgo` for call sites that prefer the explicit name. */
export function formatRelativeTime(isoOrEpochMs: number): string {
  return timeAgo(isoOrEpochMs);
}

/** HH:MM from epoch ms. */
export function formatTime(ms: number): string {
  const date = new Date(ms);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Short date "12 Aug 2026" from epoch ms. */
export function formatDate(ms: number): string {
  const date = new Date(ms);
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}