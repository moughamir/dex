import { afterEach, describe, expect, it, vi } from "vitest";

import { createMotionManager, type MotionHandle } from "$lib/ui/motion";
import { createTimeline, type TimelineStep } from "$lib/ui/motion/timeline";

interface ControllableHandle {
  handle: {
    cancel: ReturnType<typeof vi.fn<() => void>>;
    finish: ReturnType<typeof vi.fn<() => void>>;
    finished: Promise<void>;
  };
  resolve: () => void;
}

function createControllableHandle(): ControllableHandle {
  let resolve!: () => void;
  const finished = new Promise<void>((res) => {
    resolve = res;
  });
  return {
    handle: {
      cancel: vi.fn<() => void>(),
      finish: vi.fn<() => void>(),
      finished,
    },
    resolve,
  };
}

function createFakeDriver(handles: ControllableHandle[]) {
  return {
    animate: vi.fn<
      (
        el: Element,
        keyframes: Keyframe[],
        options: KeyframeAnimationOptions,
      ) => MotionHandle
    >(() => {
      const entry = createControllableHandle();
      handles.push(entry);
      return entry.handle;
    }),
    setVar: vi.fn<(name: `--${string}`, value: string) => void>(),
  };
}

function el(): Element {
  return {} as Element;
}

describe("createTimeline", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("passes steps to the driver with resolved ms/bezier values (no raw tokens)", () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const steps: TimelineStep[] = [
      {
        el: el(),
        keyframes: [{ opacity: 0 }],
        options: { duration: "normal", easing: "smooth" },
      },
      {
        el: el(),
        keyframes: [{ opacity: 1 }],
        options: { duration: "slower", easing: "spring" },
        at: 100,
      },
    ];

    const timeline = createTimeline(steps, manager);
    timeline.play();

    expect(driver.animate).toHaveBeenCalledTimes(1);
    expect(driver.animate.mock.calls[0][1]).toEqual([{ opacity: 0 }]);
    // Resolved values only — the token strings themselves never reach the driver.
    expect(driver.animate.mock.calls[0][2]).toEqual({
      duration: 220,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
    expect(driver.animate.mock.calls[0][2].duration).not.toBe("normal");
    expect(driver.animate.mock.calls[0][2].easing).not.toBe("smooth");
  });

  it("sequences `at` offsets via timers", () => {
    vi.useFakeTimers();
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const steps: TimelineStep[] = [
      {
        el: el(),
        keyframes: [{ opacity: 0 }],
        options: { duration: "fast", easing: "standard" },
      },
      {
        el: el(),
        keyframes: [{ opacity: 1 }],
        options: { duration: "fast", easing: "standard" },
        at: 100,
      },
      {
        el: el(),
        keyframes: [{ opacity: 0.5 }],
        options: { duration: "fast", easing: "standard" },
        at: 250,
      },
    ];

    const timeline = createTimeline(steps, manager);
    timeline.play();

    expect(driver.animate).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(driver.animate).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(150);
    expect(driver.animate).toHaveBeenCalledTimes(3);
  });

  it("resolves finished after the longest step completes", async () => {
    vi.useFakeTimers();
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const steps: TimelineStep[] = [
      {
        el: el(),
        keyframes: [{ opacity: 0 }],
        options: { duration: "fast", easing: "standard" },
      },
      {
        el: el(),
        keyframes: [{ opacity: 1 }],
        options: { duration: "fast", easing: "standard" },
        at: 100,
      },
    ];

    const timeline = createTimeline(steps, manager);
    const done = vi.fn();
    timeline.finished.then(done);
    timeline.play();
    vi.advanceTimersByTime(100);

    expect(done).not.toHaveBeenCalled();
    handles[0].resolve();
    expect(done).not.toHaveBeenCalled();
    handles[1].resolve();

    await timeline.finished;
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("cancel clears pending timers, cancels started steps, and settles finished", async () => {
    vi.useFakeTimers();
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const steps: TimelineStep[] = [
      {
        el: el(),
        keyframes: [{ opacity: 0 }],
        options: { duration: "fast", easing: "standard" },
      },
      {
        el: el(),
        keyframes: [{ opacity: 1 }],
        options: { duration: "fast", easing: "standard" },
        at: 100,
      },
    ];

    const timeline = createTimeline(steps, manager);
    timeline.play();
    vi.advanceTimersByTime(50);
    expect(driver.animate).toHaveBeenCalledTimes(1);

    timeline.cancel();

    expect(handles[0].handle.cancel).toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    // The delayed step never started.
    expect(driver.animate).toHaveBeenCalledTimes(1);
    await expect(timeline.finished).resolves.toBeUndefined();
  });

  it("under reduced motion every step finishes immediately", async () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    manager.reduced = true;
    const steps: TimelineStep[] = [
      {
        el: el(),
        keyframes: [{ opacity: 0 }],
        options: { duration: "slow", easing: "smooth" },
      },
      {
        el: el(),
        keyframes: [{ opacity: 1 }],
        options: { duration: "slow", easing: "smooth" },
        at: 500,
      },
    ];

    const timeline = createTimeline(steps, manager);
    timeline.play();

    expect(driver.animate).not.toHaveBeenCalled();
    await expect(timeline.finished).resolves.toBeUndefined();
  });

  it("resolves finished immediately for an empty timeline", async () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });

    const timeline = createTimeline([], manager);
    timeline.play();

    expect(driver.animate).not.toHaveBeenCalled();
    await expect(timeline.finished).resolves.toBeUndefined();
  });
});
