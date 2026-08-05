import { themes, defaultTheme, type ThemeName } from "$lib/core/config/theme";
import type { Theme, ThemePalette } from "$lib/ui/themes/types";
import { storageGet, storageSet } from "$lib/core/utils/storage";

/**
 * Theme Store
 *
 * ADR-0003
 *
 * Responsibilities
 * - Manage the active theme.
 * - Synchronize the HTML `data-theme` attribute.
 * - Persist the user's choice.
 * - Expose the runtime palette for the graphics engine.
 */

const STORAGE_KEY = "theme";

class ThemeStore {
  current = $state<ThemeName>(defaultTheme);

  #initialized = false;

  /**
   * Active theme.
   */
  get theme(): Theme {
    return themes[this.current];
  }

  /**
   * Runtime palette.
   */
  get palette(): ThemePalette {
    return this.theme.palette;
  }

  /**
   * Boot the theme system.
   * Call once from +layout.svelte.
   */
  init(): void {
    if (this.#initialized) {
      return;
    }

    this.#initialized = true;

    const stored = storageGet<ThemeName>(STORAGE_KEY);

    if (stored && stored in themes) {
      this.apply(stored);
      return;
    }

    this.apply(defaultTheme);
  }

  /**
   * Apply a theme.
   */
  apply(name: ThemeName): void {
    this.current = name;

    document.documentElement.dataset.theme = name;

    storageSet(STORAGE_KEY, name);
  }

  /**
   * Toggle between themes.
   */
  toggle(): void {
    const order = Object.keys(themes) as ThemeName[];

    const index = order.indexOf(this.current);

    const next = order[(index + 1) % order.length];

    this.apply(next);
  }

  /**
   * Reset to default.
   */
  reset(): void {
    this.apply(defaultTheme);
  }

  /**
   * Check current theme.
   */
  is(name: ThemeName): boolean {
    return this.current === name;
  }
}

export const themeStore = new ThemeStore();
