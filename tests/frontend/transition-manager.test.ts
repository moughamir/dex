import { describe, expect, it, vi } from "vitest";

import { createMotionManager, type MotionHandle } from "$lib/ui/motion";
import { presets } from "$lib/ui/motion/presets";
import { createTransitionManager } from "$lib/ui/motion/transition-manager";

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

describe("createTransitionManager", () => {
  it("enter animates with the preset enter keyframes and the normal default", () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const transitions = createTransitionManager(manager);

    transitions.enter({ el: el(), kind: "fade" });

    expect(driver.animate).toHaveBeenCalledWith(
      expect.anything(),
      presets.fade.enter,
      {
        duration: 220,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    );
  });

  it("exit animates with the preset exit keyframes and the fast default", () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const transitions = createTransitionManager(manager);

    transitions.exit({ el: el(), kind: "pop", onDone: vi.fn() });

    expect(driver.animate).toHaveBeenCalledWith(
      expect.anything(),
      presets.pop.exit,
      {
        duration: 120,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    );
  });

  it("respects an explicit duration token", () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const transitions = createTransitionManager(manager);

    transitions.enter({ el: el(), kind: "pop", duration: "slower" });

    expect(driver.animate.mock.calls[0][2]).toEqual({
      duration: 600,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    });
  });

  it("presets animate transform/opacity only", () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const transitions = createTransitionManager(manager);
    const element = el();

    transitions.enter({ el: element, kind: "fade" });
    transitions.exit({ el: element, kind: "fade", onDone: vi.fn() });
    transitions.enter({ el: element, kind: "pop" });
    transitions.exit({ el: element, kind: "pop", onDone: vi.fn() });

    const allowed = new Set(["transform", "opacity"]);
    for (const call of driver.animate.mock.calls) {
      for (const keyframe of call[1] as Keyframe[]) {
        for (const key of Object.keys(keyframe)) {
          expect(allowed.has(key)).toBe(true);
        }
      }
    }
  });

  it("exit calls onDone exactly once after the animation finishes", async () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const transitions = createTransitionManager(manager);
    const onDone = vi.fn();

    const handle = transitions.exit({ el: el(), kind: "fade", onDone });
    expect(onDone).not.toHaveBeenCalled();

    handles[0].resolve();
    await handle.finished;

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("under reduced motion exit calls onDone immediately without the driver", async () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    manager.reduced = true;
    const transitions = createTransitionManager(manager);
    const onDone = vi.fn();

    transitions.exit({ el: el(), kind: "fade", onDone });

    expect(driver.animate).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("auto-cancels the prior active enter/exit on the same element", () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const transitions = createTransitionManager(manager);
    const element = el();

    transitions.enter({ el: element, kind: "fade" });
    const first = handles[0].handle;
    transitions.enter({ el: element, kind: "pop" });
    expect(first.cancel).toHaveBeenCalled();

    const second = handles[1].handle;
    transitions.exit({ el: element, kind: "fade", onDone: vi.fn() });
    expect(second.cancel).toHaveBeenCalled();
  });

  it("does not cancel a transition on a different element", () => {
    const handles: ControllableHandle[] = [];
    const driver = createFakeDriver(handles);
    const manager = createMotionManager({ driver });
    const transitions = createTransitionManager(manager);

    transitions.enter({ el: el(), kind: "fade" });
    const first = handles[0].handle;
    transitions.enter({ el: el(), kind: "fade" });

    expect(first.cancel).not.toHaveBeenCalled();
  });
});
