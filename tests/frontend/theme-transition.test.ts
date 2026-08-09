// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const managerMock = vi.hoisted(() => ({
  reduced: false,
  animate: vi.fn(),
  onPrefsChange: vi.fn(() => () => {}),
  pointer: { update: vi.fn() },
}));

vi.mock("$lib/ui/motion/motion-manager.svelte", () => ({
  MotionManager: class {},
  createMotionManager: vi.fn(() => managerMock),
  motionManager: managerMock,
}));

import { transitionTheme } from "$lib/ui/motion/theme-transition";
import { presets } from "$lib/ui/motion/presets";
import { themeStore } from "$lib/core/stores/theme.svelte";

interface ControllableHandle {
  resolve: () => void;
}

function resolveOnNextTick(): ControllableHandle {
  let resolve!: () => void;
  const finished = new Promise<void>((res) => {
    resolve = res;
  });
  managerMock.animate.mockReturnValueOnce({
    cancel: vi.fn(),
    finish: vi.fn(),
    finished,
  });
  return { resolve };
}

describe("transitionTheme", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    managerMock.reduced = false;
    managerMock.animate.mockReset();
    delete document.documentElement.dataset.theme;
  });

  it("applies instantly on the boot path (no theme applied yet)", async () => {
    await transitionTheme("light");

    expect(themeStore.current).toBe("light");
    expect(managerMock.animate).not.toHaveBeenCalled();
  });

  it("applies instantly under reduced motion", async () => {
    document.documentElement.dataset.theme = "dark";
    managerMock.reduced = true;

    await transitionTheme("cyber");

    expect(themeStore.current).toBe("cyber");
    expect(managerMock.animate).not.toHaveBeenCalled();
  });

  it("runs a fade-out/fade-in timeline and applies the theme at the opacity floor", async () => {
    vi.useFakeTimers();
    document.documentElement.dataset.theme = "dark";
    const before = themeStore.current;

    const first = resolveOnNextTick();
    const second = resolveOnNextTick();
    const pending = transitionTheme("light");

    // Step 1 started synchronously: fade out on <html> with theme tokens.
    expect(managerMock.animate).toHaveBeenCalledTimes(1);
    expect(managerMock.animate.mock.calls[0][0]).toBe(document.documentElement);
    expect(managerMock.animate.mock.calls[0][1]).toEqual(presets.fade.exit);
    expect(managerMock.animate.mock.calls[0][2]).toEqual({
      duration: "slower",
      easing: "smooth",
      // fill:"both" holds the root at opacity 0 between the fade-out end and
      // the fade-in start, so the palette swap never flashes full-opacity.
      fill: "both",
    });
    expect(themeStore.current).toBe(before);

    await vi.advanceTimersByTimeAsync(600);

    // Step 2 (fade in) started at the offset and the theme was applied.
    expect(managerMock.animate).toHaveBeenCalledTimes(2);
    expect(managerMock.animate.mock.calls[1][1]).toEqual(presets.fade.enter);
    expect(managerMock.animate.mock.calls[1][2]).toEqual({
      duration: "slower",
      easing: "smooth",
      fill: "both",
    });
    expect(themeStore.current).toBe("light");

    first.resolve();
    second.resolve();
    await pending;
  });
});
