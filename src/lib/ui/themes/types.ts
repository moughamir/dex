/**
 * ThemePalette — programmatic mirror of the CSS semantic layer.
 *
 * Concrete, resolved color strings for the graphics engine and any JS that
 * cannot read CSS custom properties (WebGL uniforms, canvas fills, ...).
 *
 * SYNC RULE (ADR-0003): every value here MUST equal the resolved semantic
 * value for the same theme in `src/lib/ui/styles/tokens.css`. When a
 * semantic token changes there, update the matching palette file here.
 * The CSS semantic layer also carries role tokens that JS does not need
 * (accent-soft, border-subtle, focus-ring, text-3, on-accent) — they live
 * in CSS only and are not mirrored.
 */
export interface ThemePalette {
	name: string;
	accent: string;
	accentStrong: string;
	surface1: string;
	surface2: string;
	surface3: string;
	text1: string;
	text2: string;
	border: string;
	gridLine: string;
	background: string;
}
