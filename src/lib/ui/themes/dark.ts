import type { Theme, ThemePalette } from "./types";

/**
 * Dark — default DEX identity.
 *
 * Mirrors the default (:root) semantic tokens defined in
 * src/lib/ui/styles/tokens.css.
 */
export const dark: Theme = {
    id: "dark",
    name: "dark",

    palette: {
        name: "dark",

        /* Brand */

        accent: "#5ddcff",
        accentStrong: "#00d4ff",

        /* Surfaces */

        background: "#05070b",

        surface1: "rgba(15, 20, 30, 0.35)",
        surface2: "rgba(15, 20, 30, 0.60)",
        surface3: "rgba(255, 255, 255, 0.08)",

        /* Typography */

        text1: "#ffffff",
        text2: "#9ecad8",

        /* Borders */

        border: "rgba(0, 212, 255, 0.20)",

        /* Graphics */

        gridLine: "rgba(0, 212, 255, 0.05)",
        gridGlow: "rgba(0, 212, 255, 0.18)",

        ambient: "#0d1726",
        fog: "#05070b",

        particle: "#5ddcff",
        particleGlow: "#00d4ff",

        /* Semantic */

        selection: "rgba(0, 212, 255, 0.22)",

        success: "#32d583",
        warning: "#f5b942",
        danger: "#ef4444"
    } satisfies ThemePalette
};
