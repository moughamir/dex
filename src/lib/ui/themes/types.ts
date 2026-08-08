/**
 * ThemePalette
 *
 * Runtime mirror of the semantic CSS layer.
 *
 * CSS remains the source of truth.
 * Every value here MUST equal its resolved counterpart in
 * src/lib/ui/styles/tokens.css.
 *
 * Used by:
 * - DOM components
 * - Canvas
 * - Three.js
 * - WebGL shaders
 * - Particle engine
 * - Charts
 * - Widgets
 */

export interface ThemePalette {
  /* --------------------------------------------------------------------- */
  /* Identity                                                              */
  /* --------------------------------------------------------------------- */

  readonly name: ThemeMode;

  /* --------------------------------------------------------------------- */
  /* Brand                                                                 */
  /* --------------------------------------------------------------------- */

  readonly accent: string;
  readonly accentStrong: string;

  /* --------------------------------------------------------------------- */
  /* Surfaces                                                              */
  /* --------------------------------------------------------------------- */

  readonly background: string;

  readonly surface1: string;
  readonly surface2: string;
  readonly surface3: string;

  /* --------------------------------------------------------------------- */
  /* Typography                                                            */
  /* --------------------------------------------------------------------- */

  readonly text1: string;
  readonly text2: string;

  /* --------------------------------------------------------------------- */
  /* Borders                                                               */
  /* --------------------------------------------------------------------- */

  readonly border: string;

  /* --------------------------------------------------------------------- */
  /* Graphics                                                              */
  /* --------------------------------------------------------------------- */

  readonly gridLine: string;
  readonly gridGlow: string;

  readonly ambient: string;
  readonly fog: string;

  readonly particle: string;
  readonly particleGlow: string;

  /* --------------------------------------------------------------------- */
  /* Semantic                                                              */
  /* --------------------------------------------------------------------- */

  readonly selection: string;

  readonly success: string;
  readonly warning: string;
  readonly danger: string;
}

export type ThemeMode = "light" | "dark" | "cyber";

export interface Theme {
  readonly id: ThemeMode;
  readonly name: ThemeMode;
  readonly palette: ThemePalette;
}
