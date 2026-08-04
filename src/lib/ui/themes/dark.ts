import type { ThemePalette } from "./types";

/**
 * Dark — the default identity (matches `:root` in tokens.css).
 *
 * SYNC RULE (ADR-0003): keep the resolved values below equal to the
 * semantic layer for the default theme in src/lib/ui/styles/tokens.css.
 */
export const dark: ThemePalette = {
	name: "dark",
	accent: "#5ddcff",
	accentStrong: "#00d4ff",
	surface1: "rgba(15, 20, 30, 0.35)",
	surface2: "rgba(15, 20, 30, 0.6)",
	surface3: "rgba(255, 255, 255, 0.08)",
	text1: "#ffffff",
	text2: "#9ecad8",
	border: "rgba(0, 212, 255, 0.2)",
	gridLine: "rgba(0, 212, 255, 0.05)",
	background: "#05070b",
};
