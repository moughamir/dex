import type { ThemePalette } from "./types";

/**
 * Cyber — electric dark variant: brighter cyan, violet/magenta-tinted
 * hairlines. Still dark, still glass.
 *
 * SYNC RULE (ADR-0003): keep the resolved values below equal to the
 * semantic layer for `[data-theme='cyber']` in src/lib/ui/styles/tokens.css.
 */
export const cyber: ThemePalette = {
	name: "cyber",
	accent: "#66e6ff",
	accentStrong: "#00e5ff",
	surface1: "rgba(8, 12, 24, 0.45)",
	surface2: "rgba(8, 12, 24, 0.7)",
	surface3: "rgba(255, 255, 255, 0.1)",
	text1: "#ffffff",
	text2: "#a8e6f7",
	border: "rgba(0, 229, 255, 0.3)",
	gridLine: "rgba(160, 110, 255, 0.1)",
	background: "#060a14",
};
