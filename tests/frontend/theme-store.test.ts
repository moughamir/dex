import { beforeEach, describe, expect, it, vi } from "vitest";

import { themes, defaultTheme, type ThemeName } from "$lib/core/config/theme";
import { themeStore } from "$lib/core/stores/theme.svelte";

const order = Object.keys(themes) as ThemeName[];

function resetDom() {
  const dataset: Record<string, string> = {};
  (globalThis as Record<string, unknown>).document = {
    documentElement: { dataset },
  };
}

describe("themeStore", () => {
  beforeEach(() => {
    resetDom();
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
  });

  it("restores a persisted theme on init", async () => {
    const store = new Map<string, string>([["dex.theme", '"light"' ]]);
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      length: store.size,
    } as Storage;
    vi.resetModules();
    const fresh = await import("$lib/core/stores/theme.svelte");
    fresh.themeStore.init();
    expect(fresh.themeStore.current).toBe("light");
  });

  it("boots to the default theme", () => {
    themeStore.init();
    expect(themeStore.current).toBe(defaultTheme);
  });

  it("applies a theme to the DOM and the store", () => {
    themeStore.apply("cyber");
    expect(themeStore.current).toBe("cyber");
    expect(
      (document.documentElement as { dataset: Record<string, string> }).dataset
        .theme,
    ).toBe("cyber");
  });

  it("is(name) reflects the active theme", () => {
    themeStore.apply("light");
    expect(themeStore.is("light")).toBe(true);
    expect(themeStore.is("dark")).toBe(false);
  });

  it("toggle() cycles through the theme order and wraps", () => {
    themeStore.apply("dark");
    themeStore.toggle();
    expect(themeStore.current).toBe(order[1]);
    themeStore.apply(order[order.length - 1]);
    themeStore.toggle();
    expect(themeStore.current).toBe(order[0]);
  });

  it("reset() returns to the default theme", () => {
    themeStore.apply("cyber");
    themeStore.reset();
    expect(themeStore.current).toBe(defaultTheme);
  });
});
