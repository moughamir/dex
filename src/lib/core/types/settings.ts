/**
 * Settings domain types.
 *
 * `theme` mirrors `config/theme.ts` `ThemeName` ("dark" | "cyber" | "light").
 * It is declared here as a standalone union so the types layer stays a plain
 * mirror of the IPC schemas without pulling in the theme palettes.
 */

export type SettingsTheme = "dark" | "cyber" | "light";

export interface Settings {
  refresh_interval_ms: number;
  launch_on_start: boolean;
  reduce_motion: boolean;
  theme: SettingsTheme;
}

export const DEFAULT_SETTINGS: Settings = {
  refresh_interval_ms: 5000,
  launch_on_start: false,
  reduce_motion: false,
  theme: "dark",
};
