import { isTauri } from "@tauri-apps/api/core";
import * as pluginLog from "@tauri-apps/plugin-log";

/**
 * Logging facade — the ONLY logging import the frontend may use
 * (ADR-0002 / architecture.md). Backed by `@tauri-apps/plugin-log` (the
 * Rust plugin writes to stdout + the app log dir); falls back to the
 * browser console when running outside Tauri (plain `bun run dev`).
 *
 * Use these instead of `console.*` — no direct console calls in new code.
 */
const usePlugin = isTauri();

function format(args: unknown[]): string {
  return args
    .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
    .join(" ");
}

export function logTrace(...args: unknown[]): void {
  if (usePlugin) pluginLog.trace(format(args));
  else console.trace(...args);
}

export function logDebug(...args: unknown[]): void {
  if (usePlugin) pluginLog.debug(format(args));
  else console.debug(...args);
}

export function logInfo(...args: unknown[]): void {
  if (usePlugin) pluginLog.info(format(args));
  else console.info(...args);
}

export function logWarn(...args: unknown[]): void {
  if (usePlugin) pluginLog.warn(format(args));
  else console.warn(...args);
}

export function logError(...args: unknown[]): void {
  if (usePlugin) pluginLog.error(format(args));
  else console.error(...args);
}
