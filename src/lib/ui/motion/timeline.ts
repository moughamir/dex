import type { MotionHandle } from "./driver";
import type {
  MotionAnimationOptions,
  MotionManager,
} from "./motion-manager.svelte";

export interface TimelineStep {
  el: Element;
  keyframes: Keyframe[];
  options: MotionAnimationOptions;
  /** ms offset from timeline start; absent/0 = starts with step 1. */
  at?: number;
}

export interface Timeline {
  play(): void;
  cancel(): void;
  readonly finished: Promise<void>;
}

/**
 * Plays a set of WAAPI animations as one timeline. Steps run in parallel by
 * default; `at` offsets (ms from timeline start) sequence them. `finished`
 * resolves when the longest step completes. Under reduced motion every step
 * finishes immediately and no animation or timer is scheduled.
 */
export function createTimeline(
  steps: TimelineStep[],
  manager: MotionManager,
): Timeline {
  const handles: MotionHandle[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];
  let started = false;
  let settled = false;
  let resolveFinished = (): void => {};
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  function settle(): void {
    if (settled) return;
    settled = true;
    resolveFinished();
  }

  function play(): void {
    if (started) return;
    started = true;

    if (steps.length === 0 || manager.reduced) {
      // Reduced motion (or nothing to play): every step is already done.
      settle();
      return;
    }

    let pending = 0;
    const track = (handle: MotionHandle): void => {
      pending += 1;
      handle.finished.then(
        () => {
          pending -= 1;
          if (pending === 0) settle();
        },
        () => {
          // A step was cancelled/superseded: drop it from the count. If every
          // step ends rejected the timeline still settles (never a dead
          // promise); `cancel()` settles explicitly as well.
          pending -= 1;
          if (pending === 0) settle();
        },
      );
    };

    for (const step of steps) {
      const at = step.at ?? 0;
      const start = (): void => {
        const handle = manager.animate(step.el, step.keyframes, step.options);
        handles.push(handle);
        track(handle);
      };
      if (at > 0) {
        timers.push(setTimeout(start, at));
      } else {
        start();
      }
    }
  }

  function cancel(): void {
    for (const timer of timers) clearTimeout(timer);
    timers.length = 0;
    for (const handle of handles) handle.cancel();
    handles.length = 0;
    settle();
  }

  return { play, cancel, finished };
}
