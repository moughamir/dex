import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MonitorInfo, WindowMetrics } from "$lib/core/types/window";

const api = vi.hoisted(() => {
  type SizeLike = { width: number; height: number };
  type Handlers = {
    onResized: ((size: SizeLike) => void) | null;
    onMoved: (() => void) | null;
    onScaleChanged: ((scaleFactor: number, size: SizeLike) => void) | null;
    onFocusChanged: ((focused: boolean) => void) | null;
  };

  const handlers: Handlers = {
    onResized: null,
    onMoved: null,
    onScaleChanged: null,
    onFocusChanged: null,
  };
  const unlisten = vi.fn();

  return {
    isTauriWindow: vi.fn(() => true),
    getWindowMetrics: vi.fn(),
    subscribeWindowEvents: vi.fn(async (h: Handlers) => {
      handlers.onResized = h.onResized;
      handlers.onMoved = h.onMoved;
      handlers.onScaleChanged = h.onScaleChanged;
      handlers.onFocusChanged = h.onFocusChanged;
      return unlisten;
    }),
    handlers,
    unlisten,
  };
});

vi.mock("$lib/core/api/window", () => api);

import { windowStore } from "$lib/core/stores/window.svelte";

const monitorA: MonitorInfo = {
  name: "DP-1",
  size: { width: 2560, height: 1440 },
  position: { x: 0, y: 0 },
  scaleFactor: 2,
};

const monitorB: MonitorInfo = {
  name: "DP-2",
  size: { width: 2560, height: 1440 },
  position: { x: 2560, y: 0 },
  scaleFactor: 2,
};

const metrics: WindowMetrics = {
  logicalSize: { width: 1280, height: 720 },
  physicalSize: { width: 2560, height: 1440 },
  outerSize: { width: 2560, height: 1440 },
  scaleFactor: 2,
  monitor: monitorA,
  isFullscreen: false,
};

describe("windowStore", () => {
  beforeEach(async () => {
    await windowStore.reset();
    api.getWindowMetrics.mockReset();
    api.subscribeWindowEvents.mockClear();
    api.unlisten.mockClear();
    api.handlers.onResized = null;
    api.handlers.onMoved = null;
    api.handlers.onScaleChanged = null;
    api.handlers.onFocusChanged = null;
  });

  it("init populates size/scaleFactor/monitor/isFullscreen from metrics", async () => {
    api.getWindowMetrics.mockResolvedValue(metrics);

    await windowStore.init();

    expect(windowStore.size).toEqual({ width: 1280, height: 720 });
    expect(windowStore.scaleFactor).toBe(2);
    expect(windowStore.monitor).toEqual(monitorA);
    expect(windowStore.isFullscreen).toBe(false);
    expect(windowStore.ready).toBe(true);
    expect(windowStore.physicalSize).toEqual({ width: 2560, height: 1440 });
    expect(windowStore.dpr).toBe(2);
  });

  it("init is idempotent — two calls → one getWindowMetrics + one subscribe", async () => {
    api.getWindowMetrics.mockResolvedValue(metrics);

    await Promise.all([windowStore.init(), windowStore.init()]);
    await windowStore.init();

    expect(api.getWindowMetrics).toHaveBeenCalledTimes(1);
    expect(api.subscribeWindowEvents).toHaveBeenCalledTimes(1);
  });

  it("onResized updates size to logical (physical / scaleFactor)", async () => {
    api.getWindowMetrics.mockResolvedValue(metrics);
    await windowStore.init();

    api.handlers.onResized?.({ width: 3000, height: 1688 });

    expect(windowStore.size).toEqual({ width: 1500, height: 844 });
  });

  it("onScaleChanged updates scaleFactor AND size at the new factor", async () => {
    api.getWindowMetrics.mockResolvedValue(metrics);
    await windowStore.init();

    api.handlers.onScaleChanged?.(3, { width: 3840, height: 2160 });

    expect(windowStore.scaleFactor).toBe(3);
    expect(windowStore.size).toEqual({ width: 1280, height: 720 });
  });

  it("onMoved re-queries the monitor and only updates when changed", async () => {
    api.getWindowMetrics.mockResolvedValue(metrics);
    await windowStore.init();
    expect(windowStore.monitor).toEqual(monitorA);

    // Same monitor → no update.
    await api.handlers.onMoved?.();
    expect(windowStore.monitor).toEqual(monitorA);

    // Different monitor → update.
    api.getWindowMetrics.mockResolvedValue({ ...metrics, monitor: monitorB });
    await api.handlers.onMoved?.();
    expect(windowStore.monitor).toEqual(monitorB);

    // Back to the same monitor → no churn.
    await api.handlers.onMoved?.();
    expect(windowStore.monitor).toEqual(monitorB);

    expect(api.getWindowMetrics).toHaveBeenCalledTimes(4);
  });

  it("onFocusChanged updates focused", async () => {
    api.getWindowMetrics.mockResolvedValue(metrics);
    await windowStore.init();
    expect(windowStore.focused).toBe(false);

    api.handlers.onFocusChanged?.(true);
    expect(windowStore.focused).toBe(true);

    api.handlers.onFocusChanged?.(false);
    expect(windowStore.focused).toBe(false);
  });

  it("non-Tauri path falls back to browser globals and never subscribes", async () => {
    api.getWindowMetrics.mockResolvedValue(null);
    (globalThis as Record<string, unknown>).window = {
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 2,
    };
    (globalThis as Record<string, unknown>).document = {
      hasFocus: () => true,
    };

    await windowStore.init();

    expect(windowStore.size).toEqual({ width: 1280, height: 720 });
    expect(windowStore.scaleFactor).toBe(2);
    expect(windowStore.monitor).toBeNull();
    expect(windowStore.isFullscreen).toBe(false);
    expect(windowStore.focused).toBe(true);
    expect(windowStore.ready).toBe(true);
    expect(api.subscribeWindowEvents).not.toHaveBeenCalled();
  });

  it("reset clears state and calls unlisten", async () => {
    api.getWindowMetrics.mockResolvedValue(metrics);
    await windowStore.init();
    expect(windowStore.ready).toBe(true);

    await windowStore.reset();

    expect(api.unlisten).toHaveBeenCalledTimes(1);
    expect(windowStore.ready).toBe(false);
    expect(windowStore.size).toEqual({ width: 0, height: 0 });
    expect(windowStore.scaleFactor).toBe(1);
    expect(windowStore.monitor).toBeNull();
    expect(windowStore.isFullscreen).toBe(false);
    expect(windowStore.focused).toBe(false);

    // After reset the store can init again (fresh subscribe).
    api.getWindowMetrics.mockResolvedValue(metrics);
    await windowStore.init();
    expect(windowStore.ready).toBe(true);
    expect(api.subscribeWindowEvents).toHaveBeenCalledTimes(2);
  });
});
