import { describe, expect, it, vi } from "vitest";
import {
  createFpsMeter,
  FPS_DEFAULT_WINDOW_MS,
} from "$lib/graphics/fps";

const FRAME_16_6 = 1000 / 60;

describe("createFpsMeter", () => {
  it("starts at a sane default of 60 before any sample", () => {
    const meter = createFpsMeter();
    expect(meter.value).toBe(60);
  });

  it("exports the default sampling window of 500ms", () => {
    expect(FPS_DEFAULT_WINDOW_MS).toBe(500);
  });

  it("computes ~60fps from a 500ms window of 16.66ms ticks", () => {
    const onSample = vi.fn();
    const meter = createFpsMeter({ onSample });

    // 31 ticks spanning exactly 500ms → 30 frame deltas of 16.66ms.
    for (let i = 0; i <= 30; i++) {
      meter.tick(i * FRAME_16_6);
    }

    expect(onSample).toHaveBeenCalledTimes(1);
    const [fps] = onSample.mock.calls[0] as [number];
    expect(fps).toBeCloseTo(60, 1);
    expect(meter.value).toBeCloseTo(60, 1);
  });

  it("samples once per closed window and reopens fresh accumulators", () => {
    const onSample = vi.fn();
    const meter = createFpsMeter({ onSample });

    // Window 1: 30 × 16.66ms → 60fps.
    for (let i = 0; i <= 30; i++) {
      meter.tick(i * FRAME_16_6);
    }
    expect(onSample).toHaveBeenCalledTimes(1);

    // Window 2: 60 × 8.33ms (120fps), continuing from the last tick.
    let t = 30 * FRAME_16_6;
    for (let i = 0; i < 60; i++) {
      t += 1000 / 120;
      meter.tick(t);
    }

    expect(onSample).toHaveBeenCalledTimes(2);
    const [fps] = onSample.mock.calls[1] as [number];
    expect(fps).toBeCloseTo(120, 1);
    expect(meter.value).toBeCloseTo(120, 1);
  });

  it("never samples and stays at the default when no ticks arrive", () => {
    const onSample = vi.fn();
    const meter = createFpsMeter({ onSample });

    expect(meter.value).toBe(60);
    expect(onSample).not.toHaveBeenCalled();

    // A single lone tick opens a window but contributes no delta.
    meter.tick(123);
    expect(meter.value).toBe(60);
    expect(onSample).not.toHaveBeenCalled();
  });

  it("respects a custom windowMs", () => {
    const onSample = vi.fn();
    const meter = createFpsMeter({ windowMs: 100, onSample });

    // 6 × 16.66ms ≈ 100ms → window closes at 60fps.
    for (let i = 0; i <= 6; i++) {
      meter.tick(i * FRAME_16_6);
    }

    expect(onSample).toHaveBeenCalledTimes(1);
    const [fps] = onSample.mock.calls[0] as [number];
    expect(fps).toBeCloseTo(60, 1);
  });

  it("reset() zeroes the accumulators so measurement restarts fresh", () => {
    const onSample = vi.fn();
    const meter = createFpsMeter({ windowMs: 100, onSample });

    // Partial window: 5 ticks of 10ms → acc = 40 < 100, no sample yet.
    for (let i = 0; i <= 4; i++) {
      meter.tick(i * 10);
    }
    expect(onSample).not.toHaveBeenCalled();

    meter.reset();

    // After reset: 11 ticks of 10ms → acc = 100 → exactly one sample.
    for (let i = 0; i <= 10; i++) {
      meter.tick(1000 + i * 10);
    }
    expect(onSample).toHaveBeenCalledTimes(1);
    const [fps] = onSample.mock.calls[0] as [number];
    expect(fps).toBeCloseTo(100, 1);
    expect(meter.value).toBeCloseTo(100, 1);
  });

  it("closes the window before notifying so a throwing subscriber cannot corrupt the accumulators", () => {
    let calls = 0;
    const meter = createFpsMeter({
      onSample: () => {
        calls += 1;
        if (calls === 1) throw new Error("boom");
      },
    });

    // Window 1: the sample throws, but the window already closed (accumulators
    // zeroed) before the notification — nothing corrupts.
    expect(() => {
      for (let i = 0; i <= 30; i++) {
        meter.tick(i * FRAME_16_6);
      }
    }).toThrow("boom");
    expect(calls).toBe(1);

    // Window 2 proceeds cleanly from the zeroed accumulators: another ~500ms
    // of 16.66ms frames samples again at ~60fps.
    const t0 = 31 * FRAME_16_6;
    for (let i = 0; i <= 30; i++) {
      meter.tick(t0 + i * FRAME_16_6);
    }
    expect(calls).toBe(2);
    expect(meter.value).toBeCloseTo(60, 1);
  });

  it("guards against division by zero when the window can close with no elapsed time", () => {
    const onSample = vi.fn();
    const meter = createFpsMeter({ windowMs: 0, onSample });

    // Zero-delta ticks must never divide by zero or emit NaN/Infinity.
    meter.tick(100);
    meter.tick(100);
    meter.tick(100);
    expect(meter.value).toBe(60);
    expect(onSample).not.toHaveBeenCalled();
  });
});
