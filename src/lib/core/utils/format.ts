/**
 * Human-readable formatting helpers for the dashboard and widgets.
 * Locale-stable (no `toLocaleString`) so tests and SSR are deterministic.
 */

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const magnitude = Math.floor(Math.log(bytes) / Math.log(1024));
  const unit = BYTE_UNITS[Math.min(magnitude, BYTE_UNITS.length - 1)];
  if (unit === "B") return `${bytes} B`;
  const value = bytes / 1024 ** Math.min(magnitude, BYTE_UNITS.length - 1);
  return `${value.toFixed(decimals)} ${unit}`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 10) / 10}%`;
}

export function formatUptime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return "0s";
  const total = Math.floor(secs);
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
  return formatUptime(Math.round(ms / 1000));
}

export function formatFrequency(mhz: number): string {
  if (!Number.isFinite(mhz) || mhz < 0) return "0 MHz";
  if (mhz >= 1000) return `${(mhz / 1000).toFixed(2)} GHz`;
  return `${Math.round(mhz)} MHz`;
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return String(Math.round(n * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}