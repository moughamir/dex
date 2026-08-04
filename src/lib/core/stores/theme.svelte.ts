import { dark } from "$lib/ui/themes/dark";
import { light } from "$lib/ui/themes/light";
import { cyber } from "$lib/ui/themes/cyber";
import type { ThemePalette } from "$lib/ui/themes/types";
import { storageGet, storageSet } from "../utils/storage";

/**
 * Theme state — ADR-0003. CSS owns the switch (data-theme on <html>); this
 * store manages the attribute, persists the choice, and exposes the current
 * palette as data for programmatic/GPU use. Dark is the shell default.
 */

export const THEMES = {
  dark,
  light,
  cyber,
} as const satisfies Record<string, ThemePalette>;

export type ThemeName = keyof typeof THEMES;

const STORAGE_KEY = "theme";
const DEFAULT_THEME: ThemeName = "dark";

export let themeName = $state<ThemeName>(DEFAULT_THEME);
export const palette = $derived(THEMES[themeName]);

const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === "string" && value in THEMES;

let initialized = false;

/** Applies the persisted (or default) theme. Call once at shell boot. */
export function initTheme(): void {
  if (initialized) return;
  initialized = true;
  const stored = storageGet<ThemeName>(STORAGE_KEY);
  applyTheme(isThemeName(stored) ? stored : DEFAULT_THEME);
}

export function applyTheme(name: ThemeName): void {
  themeName = name;
  document.documentElement.dataset.theme = name;
  storageSet(STORAGE_KEY, name);
}

export function toggleTheme(): void {
  const order = Object.keys(THEMES) as ThemeName[];
  const next = order[(order.indexOf(themeName) + 1) % order.length];
  applyTheme(next);
}
