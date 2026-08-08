import { getCurrentWindow, currentMonitor } from "@tauri-apps/api/window";
import { isTauri } from "@tauri-apps/api/core";
import type { MonitorInfo, Size, WindowMetrics } from "$lib/core/types/window";
import { toLogical } from "$lib/core/utils/window-geometry";

/**
 * Window/monitor/DPI boundary — the ONLY place `@tauri-apps/api/window`
 * may be imported (repo boundary rule, ADR-0002). Everything else consumes
 * `core/stores/window.svelte.ts` or `core/services`.
 */

/** True when running inside the Tauri webview. */
export function isTauriWindow(): boolean {
  return isTauri();
}

/**
 * Read the current window metrics (size, DPI, monitor, fullscreen).
 * Returns `null` outside Tauri (browser-dev fallback is the caller's job).
 *
 * Event payloads from `@tauri-apps/api/window` arrive in device pixels;
 * `logicalSize` is derived from the physical `innerSize` at the reported
 * scale factor.
 */
export async function getWindowMetrics(): Promise<WindowMetrics | null> {
  if (!isTauriWindow()) {
    return null;
  }

  const win = getCurrentWindow();
  const [scaleFactor, innerSize, outerSize, isFullscreen, monitor] =
    await Promise.all([
      win.scaleFactor(),
      win.innerSize(),
      win.outerSize(),
      win.isFullscreen(),
      currentMonitor(),
    ]);

  const monitorInfo: MonitorInfo | null = monitor
    ? {
        name: monitor.name,
        size: { width: monitor.size.width, height: monitor.size.height },
        position: { x: monitor.position.x, y: monitor.position.y },
        scaleFactor: monitor.scaleFactor,
      }
    : null;

  const physicalSize: Size = {
    width: innerSize.width,
    height: innerSize.height,
  };

  return {
    logicalSize: toLogical(physicalSize, scaleFactor),
    physicalSize,
    outerSize: { width: outerSize.width, height: outerSize.height },
    scaleFactor,
    monitor: monitorInfo,
    isFullscreen,
  };
}

export interface WindowEventHandlers {
  onResized: (size: Size) => void;
  onMoved: () => void;
  onScaleChanged: (scaleFactor: number, size: Size) => void;
  onFocusChanged: (focused: boolean) => void;
}

/**
 * Subscribe to current-window lifecycle events. Event payloads arrive in
 * device (physical) pixels — consumers convert with `toLogical`.
 * Resolves to a single unlisten that tears down all four listeners.
 */
export async function subscribeWindowEvents(
  handlers: WindowEventHandlers,
): Promise<() => void> {
  const win = getCurrentWindow();
  const [unlistenResized, unlistenMoved, unlistenScale, unlistenFocus] =
    await Promise.all([
      win.onResized(({ payload }) =>
        handlers.onResized({ width: payload.width, height: payload.height }),
      ),
      win.onMoved(() => handlers.onMoved()),
      win.onScaleChanged(({ payload }) =>
        handlers.onScaleChanged(payload.scaleFactor, {
          width: payload.size.width,
          height: payload.size.height,
        }),
      ),
      win.onFocusChanged(({ payload }) => handlers.onFocusChanged(payload)),
    ]);

  return () => {
    unlistenResized();
    unlistenMoved();
    unlistenScale();
    unlistenFocus();
  };
}
