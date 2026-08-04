import type { ThemePalette } from "./types";

/**
 * Light — bright glass over a light desktop.
 *
 * SYNC RULE (ADR-0003): keep the resolved values below equal to the
 * semantic layer for `[data-theme='light']` in src/lib/ui/styles/tokens.css.
 */
export const light: ThemePalette = {
	name: "light",
	accent: "#0090b3",
	accentStrong: "#00709a",
	surface1: "rgba(255, 255, 255, 0.45)",
	surface2: "rgba(255, 255, 255, 0.68)",
	surface3: "rgba(15, 20, 30, 0.06)",
	text1: "#0b141d",
	text2: "#2e4d61",
	border: "rgba(0, 112, 154, 0.35)",
	gridLine: "rgba(0, 144, 179, 0.14)",
	background: "#e8eef2",
};
