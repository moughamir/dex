import type { Theme, ThemePalette } from "./types";

/**
 * Light — glass desktop.
 *
 * Mirrors the semantic layer for
 * [data-theme="light"].
 */
export const light: Theme = {
    id: "light",
    name: "light",

    palette: {
        name: "light",

        /* Brand */

        accent: "#0090b3",
        accentStrong: "#00709a",

        /* Surfaces */

        background: "#e8eef2",

        surface1: "rgba(255, 255, 255, 0.45)",
        surface2: "rgba(255, 255, 255, 0.68)",
        surface3: "rgba(15, 20, 30, 0.06)",

        /* Typography */

        text1: "#0b141d",
        text2: "#2e4d61",

        /* Borders */

        border: "rgba(0, 112, 154, 0.35)",

        /* Graphics */

        gridLine: "rgba(0, 144, 179, 0.14)",
        gridGlow: "rgba(0, 144, 179, 0.25)",

        ambient: "#ffffff",
        fog: "#dde5ea",

        particle: "#0090b3",
        particleGlow: "#00b5dd",

        /* Semantic */

        selection: "rgba(0, 144, 179, 0.18)",

        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626"
    } satisfies ThemePalette
};
