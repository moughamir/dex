// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { motionManager } from "$lib/ui/motion/motion-manager.svelte";
import { transitionTheme } from "$lib/ui/motion/theme-transition";
import { themeStore } from "$lib/core/stores/theme.svelte";

/**
 * Regression (ora-2 REQUIRED CHANGE 1): if reduced motion flips ON mid-fade,
 * the fade-in step must synchronously place `<html>` at the keyframes' final
 * state (opacity 1) — never leave the shell invisible at opacity 0.
 *
 * This file uses the REAL engine (unlike theme-transition.test.ts, which mocks
 * the manager module): the real `motionManager` singleton's reduced branch
 * applies the final state directly to the element.
 */
describe("transitionTheme — mid-flight reduced-motion flip", () => {
  beforeEach(() => {
    motionManager.reduced = false;
    delete document.documentElement.dataset.theme;
    document.documentElement.style.removeProperty("opacity");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lands <html> at opacity 1 when reduced motion flips on mid-fade", async () => {
    vi.useFakeTimers();
    document.documentElement.dataset.theme = "dark";
    // Simulate the mid-fade state: the fade-out step already brought <html> to
    // ~0 opacity (jsdom has no WAAPI, so we set the floor explicitly).
    document.documentElement.style.setProperty("opacity", "0");

    const pending = transitionTheme("light");

    // Fade-out step has run; the palette is not yet applied (waiting on the
    // floor swap). The user flips reduced motion ON mid-flight.
    await vi.advanceTimersByTimeAsync(599);
    expect(themeStore.current).toBe("dark");
    motionManager.reduced = true;

    // The fade-in step fires at the floor under reduced motion → the element
    // is synchronously placed at fade.enter's final state.
    await vi.advanceTimersByTimeAsync(1);
    expect(document.documentElement.style.opacity).toBe("1");
    expect(themeStore.current).toBe("light");

    await pending;
  });
});
