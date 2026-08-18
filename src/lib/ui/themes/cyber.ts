import type { Theme, ThemePalette } from "./types";

/**
 * Cyber — neon glass.
 *
 * Mirrors the semantic layer for
 * [data-theme="cyber"].
 */
export const cyber: Theme = {
  id: "cyber",
  name: "cyber",

  palette: {
    name: "cyber",

    /* Brand */

    accent: "#66e6ff",
    accentStrong: "#00e5ff",

    /* Surfaces */

    background: "#060a14",

    surface1: "rgba(8, 12, 24, 0.45)",
    surface2: "rgba(8, 12, 24, 0.70)",
    surface3: "rgba(255, 255, 255, 0.10)",

    /* Typography */

    text1: "#ffffff",
    text2: "#a8e6f7",

    /* Borders */

    border: "rgba(0, 229, 255, 0.30)",

    /* Graphics */

    gridLine: "rgba(160, 110, 255, 0.10)",
    gridGlow: "rgba(102, 230, 255, 0.30)",

    ambient: "#081221",
    fog: "#060a14",

    particle: "#66e6ff",
    particleGlow: "#00ffff",

    /* Semantic */

    selection: "rgba(102, 230, 255, 0.22)",

    success: "#22c55e",
    warning: "#facc15",
    danger: "#ff4d6d",
  } satisfies ThemePalette,
};
