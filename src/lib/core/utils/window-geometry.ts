import type { MonitorInfo, Size } from "$lib/core/types/window";

/**
 * Pure DPI geometry helpers — NO Tauri imports (node-env testable).
 *
 * Sizes from Tauri events (`onResized`, `onScaleChanged`) arrive in device
 * (physical) pixels; consumers convert with `toLogical` before storing.
 */

/** Convert a physical-pixel size to logical pixels at the given scale factor. */
export function toLogical(size: Size, scaleFactor: number): Size {
  return {
    width: Math.round(size.width / scaleFactor),
    height: Math.round(size.height / scaleFactor),
  };
}

/** Convert a logical-pixel size to physical pixels at the given scale factor. */
export function toPhysical(size: Size, scaleFactor: number): Size {
  return {
    width: Math.round(size.width * scaleFactor),
    height: Math.round(size.height * scaleFactor),
  };
}

/** Structural equality for two sizes. */
export function sizeEquals(a: Size, b: Size): boolean {
  return a.width === b.width && a.height === b.height;
}

/** Structural equality for two (possibly null) monitors. */
export function monitorEquals(
  a: MonitorInfo | null,
  b: MonitorInfo | null,
): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  return (
    a.name === b.name &&
    sizeEquals(a.size, b.size) &&
    a.position.x === b.position.x &&
    a.position.y === b.position.y &&
    a.scaleFactor === b.scaleFactor
  );
}
