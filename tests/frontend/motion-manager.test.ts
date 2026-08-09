import { afterEach, describe, expect, it, vi } from "vitest";

import { createMotionManager, type MotionHandle } from "$lib/ui/motion";
import { presets } from "$lib/ui/motion/presets";
import { DURATION, EASE } from "$lib/ui/motion/types";

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

type AnimateFn = (
  el: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) => MotionHandle;
type SetVarFn = (name: `--${string}`, value: string) => void;
type ChangeListener = (event: MediaQueryListEvent) => void;

function mockMatchMedia(matches: boolean): MockMediaQueryList {
  const mql: MockMediaQueryList = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn<(...args: [string, ChangeListener]) => void>(),
    removeEventListener: vi.fn<(...args: [string, ChangeListener]) => void>(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );
  return mql;
}

function finishedHandle(): MotionHandle {
  return {
    cancel: vi.fn(),
    finish: vi.fn(),
    finished: Promise.resolve(),
  };
}

function createFakeDriver() {
  return {
    animate: vi.fn<AnimateFn>(() => finishedHandle()),
    setVar: vi.fn<SetVarFn>(),
  };
}

/** An element shaped like an inline-style host; records style.setProperty. */
function styleableElement(): {
  el: Element;
  setProperty: ReturnType<typeof vi.fn>;
} {
  const setProperty = vi.fn();
  const el = { style: { setProperty } } as unknown as Element;
  return { el, setProperty };
}

describe("MotionManager", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to reduced=false when no matchMedia implementation exists", () => {
    const manager = createMotionManager();
    expect(manager.reduced).toBe(false);
  });

  it("reads reduced from an injected matchMedia stub via vi.stubGlobal", () => {
    mockMatchMedia(true);
    const manager = createMotionManager();
    expect(manager.reduced).toBe(true);
  });

  it("stays non-reduced when the stub reports no preference", () => {
    mockMatchMedia(false);
    const manager = createMotionManager();
    expect(manager.reduced).toBe(false);
  });

  it("binds the window.matchMedia fallback so host methods keep their receiver", () => {
    const fakeWindow = {
      matchMedia(this: unknown, query: string) {
        // Host methods like window.matchMedia throw "Illegal invocation"
        // when called with a receiver other than their owner.
        if (this !== fakeWindow) throw new TypeError("Illegal invocation");
        return {
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      },
    };
    vi.stubGlobal("window", fakeWindow);
    expect(() => createMotionManager()).not.toThrow();
    expect(createMotionManager().reduced).toBe(false);
  });

  it("honours an explicitly injected matchMedia over the global stub", () => {
    const injected = vi.fn(() => ({ matches: true }) as MediaQueryList);
    // The global stub reports false; the injected one must win.
    mockMatchMedia(false);
    const manager = createMotionManager({ matchMedia: injected });
    expect(manager.reduced).toBe(true);
    expect(injected).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("fires onPrefsChange listeners on media query changes and unsubscribes", () => {
    const mql = mockMatchMedia(false);
    const manager = createMotionManager();
    const listener = vi.fn();
    const unsubscribe = manager.onPrefsChange(listener);

    const change = mql.addEventListener.mock.calls[0][1];
    change({ matches: true } as MediaQueryListEvent);
    expect(manager.reduced).toBe(true);
    expect(listener).toHaveBeenCalledWith(true);

    change({ matches: false } as MediaQueryListEvent);
    expect(manager.reduced).toBe(false);
    expect(listener).toHaveBeenCalledWith(false);

    unsubscribe();
    change({ matches: true } as MediaQueryListEvent);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("translates DurationToken/EaseToken to ms/bezier before the driver", () => {
    const driver = createFakeDriver();
    const manager = createMotionManager({ driver });
    const el = {} as Element;

    manager.animate(el, [{ opacity: 0 }], {
      duration: "normal",
      easing: "spring",
    });

    expect(driver.animate).toHaveBeenCalledTimes(1);
    expect(driver.animate.mock.calls[0][0]).toBe(el);
    expect(driver.animate.mock.calls[0][1]).toEqual([{ opacity: 0 }]);
    expect(driver.animate.mock.calls[0][2]).toEqual({
      duration: DURATION.normal,
      easing: EASE.spring,
    });
    // Raw token strings never leak to the driver.
    expect(driver.animate.mock.calls[0][2].duration).toBe(220);
    expect(driver.animate.mock.calls[0][2].easing).toBe(
      "cubic-bezier(0.18, 1.15, 0.3, 1)",
    );
  });

  it("passes through extra KeyframeAnimationOptions untouched", () => {
    const driver = createFakeDriver();
    const manager = createMotionManager({ driver });

    manager.animate({} as Element, [{ opacity: 1 }], {
      duration: "fast",
      easing: "standard",
      delay: 50,
      iterations: 2,
    });

    expect(driver.animate.mock.calls[0][2]).toEqual({
      duration: DURATION.fast,
      easing: EASE.standard,
      delay: 50,
      iterations: 2,
    });
  });

  it("under reduced motion lands the element at the enter final state and resolves immediately", async () => {
    mockMatchMedia(true);
    const driver = createFakeDriver();
    const manager = createMotionManager({ driver });
    const { el, setProperty } = styleableElement();

    const handle = manager.animate(el, presets.fade.enter, {
      duration: "normal",
      easing: "standard",
    });

    // Enter lands fully visible — synchronously, without the driver.
    expect(setProperty).toHaveBeenCalledWith("opacity", "1");
    expect(driver.animate).not.toHaveBeenCalled();
    await expect(handle.finished).resolves.toBeUndefined();
  });

  it("under reduced motion lands exit/pop keyframes at their final state", () => {
    mockMatchMedia(true);
    const manager = createMotionManager({ driver: createFakeDriver() });

    const exit = styleableElement();
    manager.animate(exit.el, presets.fade.exit, {
      duration: "fast",
      easing: "standard",
    });
    // Exit lands fully hidden — the instant-appear/disappear contract.
    expect(exit.setProperty).toHaveBeenCalledWith("opacity", "0");

    const pop = styleableElement();
    manager.animate(pop.el, presets.pop.enter, {
      duration: "fast",
      easing: "standard",
    });
    expect(pop.setProperty).toHaveBeenCalledWith("opacity", "1");
    expect(pop.setProperty).toHaveBeenCalledWith("transform", "scale(1)");
  });

  it("applyFinalState tolerates degenerate keyframes under reduced motion", () => {
    mockMatchMedia(true);
    const manager = createMotionManager({ driver: createFakeDriver() });

    // Empty keyframes: nothing to apply, no throw.
    const empty = styleableElement();
    manager.animate(empty.el, [], { duration: "fast", easing: "standard" });
    expect(empty.setProperty).not.toHaveBeenCalled();

    // Meta-only keyframes (offset/easing): no CSS property is applied.
    const meta = styleableElement();
    manager.animate(meta.el, [{ offset: 0, easing: "ease-in" }], {
      duration: "fast",
      easing: "standard",
    });
    expect(meta.setProperty).not.toHaveBeenCalled();

    // Array-valued keyframe values: the last element wins. WAAPI calls these
    // PropertyIndexedKeyframes; the engine's public contract is Keyframe[], so
    // the cast exercises the defensive Array.isArray branch in applyFinalState.
    const arrayed = styleableElement();
    manager.animate(
      arrayed.el,
      [{ opacity: [0, 0.5, 1], transform: ["scale(0.5)", "scale(1)"] }] as unknown as Keyframe[],
      { duration: "fast", easing: "standard" },
    );
    expect(arrayed.setProperty).toHaveBeenCalledWith("opacity", "1");
    expect(arrayed.setProperty).toHaveBeenCalledWith("transform", "scale(1)");

    // Element without a style host: no throw, no writes.
    const bare = {} as Element;
    expect(() =>
      manager.animate(bare, [{ opacity: 0 }], {
        duration: "fast",
        easing: "standard",
      }),
    ).not.toThrow();
  });

  it("pointer.update writes --cursor-x/--cursor-y through the driver", () => {
    const driver = createFakeDriver();
    const manager = createMotionManager({ driver });

    manager.pointer.update(12, 34);

    expect(driver.setVar).toHaveBeenCalledWith("--cursor-x", "12px");
    expect(driver.setVar).toHaveBeenCalledWith("--cursor-y", "34px");
  });

  it("pointer.update no-ops under reduced motion", () => {
    mockMatchMedia(true);
    const driver = createFakeDriver();
    const manager = createMotionManager({ driver });

    manager.pointer.update(1, 2);

    expect(driver.setVar).not.toHaveBeenCalled();
  });

  it("dispose detaches the media listener and clears subscribers", () => {
    const mql = mockMatchMedia(false);
    const manager = createMotionManager();
    const listener = vi.fn();
    manager.onPrefsChange(listener);

    manager.dispose();

    const remove = mql.removeEventListener.mock.calls[0][1];
    const change = mql.addEventListener.mock.calls[0][1];
    expect(remove).toBe(change);
    expect(mql.removeEventListener).toHaveBeenCalledWith("change", change);
  });
});
