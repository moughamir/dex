import { getWindowMetrics, subscribeWindowEvents } from "$lib/core/api/window";
import type { MonitorInfo, Size } from "$lib/core/types/window";
import { logDebug, logError, logInfo } from "$lib/core/utils/logger";
import {
  monitorEquals,
  toLogical,
  toPhysical,
} from "$lib/core/utils/window-geometry";

/**
 * Window Store
 *
 * Tracks the current window's size (logical), DPI scale factor, monitor,
 * fullscreen/focus state, and readiness. Under Tauri it subscribes to
 * window lifecycle events (resize/move/scale/focus); outside Tauri it
 * falls back to browser globals without subscriptions.
 */
class WindowStore {
  /** Logical size of the window's inner area. */
  size = $state<Size>({ width: 0, height: 0 });

  /** DPI scale factor (1 = 100%, 2 = 200%). */
  scaleFactor = $state(1);

  /** The monitor the window currently resides on, if detectable. */
  monitor = $state<MonitorInfo | null>(null);

  isFullscreen = $state(false);

  focused = $state(false);

  /** True once initial metrics are read (and, under Tauri, events wired). */
  ready = $state(false);

  #initialized = false;
  #initPromise: Promise<void> | null = null;
  #unlisten: (() => void) | null = null;

  /** Physical (device-pixel) size derived from the logical size at DPR. */
  get physicalSize(): Size {
    return toPhysical(this.size, this.scaleFactor);
  }

  /** Alias for `scaleFactor`. */
  get dpr(): number {
    return this.scaleFactor;
  }

  /**
   * Boot the window layer. Idempotent; concurrent calls share one in-flight
   * promise. Call once from +layout.svelte. Rethrows after logging so
   * awaiting callers can react; the error is never silent.
   */
  async init(): Promise<void> {
    if (this.#initialized) {
      return;
    }
    if (this.#initPromise) {
      return this.#initPromise;
    }
    this.#initPromise = this.#boot().finally(() => {
      this.#initPromise = null;
    });
    return this.#initPromise;
  }

  async #boot(): Promise<void> {
    try {
      const metrics = await getWindowMetrics();

      if (metrics === null) {
        // Browser dev: no Tauri backend — use browser globals, no events.
        this.size = { width: window.innerWidth, height: window.innerHeight };
        this.scaleFactor = window.devicePixelRatio;
        this.monitor = null;
        this.isFullscreen = false;
        this.focused = document.hasFocus();
        this.#initialized = true;
        this.ready = true;
        logDebug("window store ready (browser fallback)");
        return;
      }

      this.size = metrics.logicalSize;
      this.scaleFactor = metrics.scaleFactor;
      this.monitor = metrics.monitor;
      this.isFullscreen = metrics.isFullscreen;

      this.#unlisten = await subscribeWindowEvents({
        onResized: (physicalSize) => {
          // Resize payloads arrive in device pixels.
          this.size = toLogical(physicalSize, this.scaleFactor);
        },
        onMoved: async () => {
          const current = await getWindowMetrics();
          if (current === null) return;
          if (!monitorEquals(this.monitor, current.monitor)) {
            this.monitor = current.monitor;
          }
        },
        onScaleChanged: (scaleFactor, physicalSize) => {
          this.scaleFactor = scaleFactor;
          this.size = toLogical(physicalSize, scaleFactor);
        },
        onFocusChanged: (focused) => {
          this.focused = focused;
        },
      });

      this.#initialized = true;
      this.ready = true;
      logInfo(
        `window store ready: ${this.size.width}x${this.size.height} @ ${this.scaleFactor}x`,
      );
    } catch (err) {
      logError("window store: init failed", err);
      throw err;
    }
  }

  /**
   * Test/teardown hook: drop listeners and restore defaults. Harmless in
   * production; used to reset the singleton between tests.
   */
  async reset(): Promise<void> {
    this.#unlisten?.();
    this.#unlisten = null;
    this.#initialized = false;
    this.#initPromise = null;
    this.#defaults();
  }

  #defaults(): void {
    this.size = { width: 0, height: 0 };
    this.scaleFactor = 1;
    this.monitor = null;
    this.isFullscreen = false;
    this.focused = false;
    this.ready = false;
  }
}

export const windowStore = new WindowStore();
