/**
 * Allocation-free, windowed FPS meter (GFX-005).
 *
 * The meter measures *rendered* frames: each `tick` closes the previous
 * frame's delta and opens a new one. Every `windowMs` of accumulated deltas it
 * computes `fps = frames * 1000 / acc`, stores it in `value`, zeroes the
 * accumulators, then emits `onSample`.
 *
 * Because `frames` counts exactly the deltas that sum into `acc`, a constant
 * frame rate yields the same reading regardless of where the window boundary
 * lands (e.g. 16.66ms frames → 60fps whether the window closes at 500ms or
 * 516ms). The tick body touches only module-scoped number fields — no closures
 * or objects are created per frame.
 */

/** Default sampling window in milliseconds. */
export const FPS_DEFAULT_WINDOW_MS = 500;

export interface FpsMeter {
  /** Records one rendered frame at `nowMs` (high-res timestamp). */
  tick(nowMs: number): void;
  /** Last computed FPS; 60 before the first sample completes. */
  readonly value: number;
  /** Zeroes the accumulators; the next tick opens a fresh window. */
  reset(): void;
}

export interface FpsMeterOptions {
  /** Sampling window in milliseconds. Defaults to `FPS_DEFAULT_WINDOW_MS`. */
  windowMs?: number;
  /** Called once per closed window with the computed FPS. */
  onSample?: (fps: number) => void;
}

export function createFpsMeter(options?: FpsMeterOptions): FpsMeter {
  const windowMs = options?.windowMs ?? FPS_DEFAULT_WINDOW_MS;
  const onSample = options?.onSample;
  // Plain closure fields — the tick body performs zero allocations.
  let value = 60;
  let acc = 0;
  let frames = 0;
  let lastTickMs = -1;

  function tick(nowMs: number): void {
    if (lastTickMs < 0) {
      // First frame in a window: it opens the window but contributes no delta.
      lastTickMs = nowMs;
      frames = 0;
      acc = 0;
      return;
    }
    acc += nowMs - lastTickMs;
    lastTickMs = nowMs;
    frames += 1;
    if (acc >= windowMs && acc > 0) {
      // m4: close the window BEFORE notifying — a throwing subscriber must
      // not corrupt the fresh accumulators. n3: `acc > 0` guards against a
      // zero (or negative) windowMs producing a division by zero.
      value = (frames * 1000) / acc;
      acc = 0;
      frames = 0;
      onSample?.(value);
    }
  }

  function reset(): void {
    acc = 0;
    frames = 0;
    lastTickMs = -1;
  }

  return {
    tick,
    get value(): number {
      return value;
    },
    reset,
  };
}
