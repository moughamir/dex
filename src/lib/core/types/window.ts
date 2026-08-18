/**
 * Local window/monitor/DPI domain types.
 *
 * These are LOCAL-ONLY shapes — camelCase, never mirrored in Rust serde and
 * never crossing the IPC wire. They model the runtime window/dpi state the UI
 * consumes (via `core/api/window` + `core/stores/window.svelte.ts`).
 * IPC-facing shapes live in `core/api/commands.ts` and stay snake_case.
 */

export interface Size {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface MonitorInfo {
  name: string | null;
  size: Size;
  position: Position;
  scaleFactor: number;
}

export interface WindowMetrics {
  logicalSize: Size;
  physicalSize: Size;
  outerSize: Size;
  scaleFactor: number;
  monitor: MonitorInfo | null;
  isFullscreen: boolean;
}
