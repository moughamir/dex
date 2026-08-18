import type { MotionHandle } from "./driver";
import { motionManager, type MotionManager } from "./motion-manager.svelte";
import { presets } from "./presets";
import type { DurationToken } from "./types";

export interface EnterExitOptions {
  el: Element;
  kind: "fade" | "pop";
  /** Defaults: enter=`normal`, exit=`fast`. */
  duration?: DurationToken;
}

export interface TransitionManager {
  enter(opts: EnterExitOptions): MotionHandle;
  exit(opts: EnterExitOptions & { onDone(): void }): MotionHandle;
}

/**
 * Enter/exit orchestration (ADR-0009 phase state machine: enter → stable →
 * exit → onDone). Any new enter/exit on an element auto-cancels the previously
 * active one (`WeakMap<Element, MotionHandle>`), so rapid enter→exit→enter
 * sequences never stack animations. `exit` runs the exit animation, then calls
 * `onDone` exactly once — immediately under reduced motion, and never when the
 * exit was cancelled/superseded (the element is no longer leaving).
 */
export function createTransitionManager(
  manager: MotionManager,
): TransitionManager {
  const active = new WeakMap<Element, MotionHandle>();

  function start(
    opts: EnterExitOptions,
    phase: "enter" | "exit",
  ): MotionHandle {
    active.get(opts.el)?.cancel();
    const handle = manager.animate(opts.el, presets[opts.kind][phase], {
      duration: opts.duration ?? (phase === "enter" ? "normal" : "fast"),
      easing: "standard",
    });
    active.set(opts.el, handle);
    return handle;
  }

  return {
    enter(opts) {
      return start(opts, "enter");
    },
    exit(opts) {
      const handle = start(opts, "exit");
      handle.finished.then(
        () => opts.onDone(),
        () => {
          // Cancelled (superseded by a newer enter/exit): onDone is
          // deliberately not called — the element is no longer exiting.
        },
      );
      return handle;
    },
  };
}

/** The app-wide transition manager, wired to the motion manager singleton. */
export const transitionManager: TransitionManager =
  createTransitionManager(motionManager);
