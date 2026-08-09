import * as THREE from "three";

/**
 * Palette string → THREE.Color/alpha parsing (M2.2).
 *
 * Supported grammar:
 * - `#rgb` / `#rrggbb` (hex)
 * - `rgb(r, g, b)` / `rgba(r, g, b, a)` — the grid line/glow alphas live in
 *   the `a` component and are surfaced separately by `parseAlpha`.
 *
 * `THREE.Color.set` does NOT parse `rgba(...)`, so applyPalette goes through
 * these small parsers instead. They allocate one Color per call, which is fine:
 * `applyPalette` runs on theme change, never per frame.
 *
 * Both functions are total: a palette missing a graphics field (or carrying a
 * non-string) falls back to `#ffffff` / alpha 1 instead of throwing through the
 * public applyPalette seam.
 */

const HEX3 = /^#([0-9a-fA-F]{3})$/;
const HEX6 = /^#([0-9a-fA-F]{6})$/;
const RGB =
  /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+)\s*)?\)$/;

/** Parses a palette color string into a THREE.Color; falls back to #ffffff. */
export function parseColor(value: string): THREE.Color {
  if (typeof value !== "string") return new THREE.Color(0xffffff);
  const trimmed = value.trim();

  const hex6 = HEX6.exec(trimmed);
  if (hex6) return new THREE.Color(`#${hex6[1]}`);

  const hex3 = HEX3.exec(trimmed);
  if (hex3) return new THREE.Color(`#${hex3[1]}`);

  const rgb = RGB.exec(trimmed);
  if (rgb) {
    return new THREE.Color(
      parseInt(rgb[1], 10) / 255,
      parseInt(rgb[2], 10) / 255,
      parseInt(rgb[3], 10) / 255,
    );
  }

  return new THREE.Color(0xffffff);
}

/** Returns the alpha component (0..1) for rgba(...) strings, else 1. */
export function parseAlpha(value: string): number {
  if (typeof value !== "string") return 1;
  const rgb = RGB.exec(value.trim());
  if (rgb && rgb[4] !== undefined) {
    const alpha = Number(rgb[4]);
    return Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 1;
  }
  return 1;
}
