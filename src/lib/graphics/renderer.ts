import * as THREE from "three";
import { logError } from "$lib/core/utils/logger";
import type { ThemePalette } from "$lib/ui/themes/types";
import { createCamera } from "./camera";
import type { Renderer, RenderSurface } from "./contracts";
import { createFpsMeter } from "./fps";
import { createLights } from "./lighting";
import { createScene } from "./scene";

/**
 * The minimal slice of `THREE.WebGLRenderer` the renderer depends on. Exported
 * so tests and DI consumers can type their stubs without a real GL context.
 */
export type GLRendererLike = Pick<
  THREE.WebGLRenderer,
  | "domElement"
  | "setPixelRatio"
  | "setSize"
  | "setClearColor"
  | "render"
  | "dispose"
  | "getPixelRatio"
  | "getSize"
>;

/**
 * Context handed to `RendererOptions.compose` at construction. The compose
 * implementation may pull the scene/camera for its own passes and read the
 * owner's palette (if one was supplied yet).
 */
export interface ComposeContext {
  glRenderer: GLRendererLike;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Current palette at construction, if the owner has one yet (optional). */
  palette?: ThemePalette;
}

/**
 * M2.2 effects/post-processing composition seam. The renderer stays the single
 * frame-loop and resource owner: it calls these hooks from its own loop,
 * resize, applyPalette, and dispose paths — the compose never schedules frames.
 */
export interface RenderCompose {
  /** Called every frame instead of glRenderer.render(scene, camera). */
  render(): void;
  /** Called after surface.resize with the device-pixel size. */
  resize?(width: number, height: number): void;
  /** Called from renderer.applyPalette after the lights are pushed. */
  applyPalette?(palette: ThemePalette): void;
  /** Called from renderer.dispose before glRenderer.dispose. */
  dispose?(): void;
}

export interface RendererOptions {
  /** Optional canvas; defaults to the renderer's own `domElement`. */
  canvas?: HTMLCanvasElement;
  /** DI seam for headless tests — never constructed when provided. */
  glRenderer?: GLRendererLike;
  /** Current palette at construction, forwarded to the compose context. */
  palette?: ThemePalette;
  /**
   * M2.2 effects/post-processing composition seam; keeps the renderer the
   * single frame/resource owner. Absent = plain scene render (M2.1 behavior
   * unchanged).
   */
  compose?(ctx: ComposeContext): RenderCompose | undefined;
}

export interface GraphicsRenderer extends Renderer {
  /** ADR-0003: scene colors pushed by the owner on theme change, never polled. */
  applyPalette(palette: ThemePalette): void;
  /** GFX-005: subscribes to windowed FPS samples; returns an unsubscribe. */
  subscribeFps(callback: (fps: number) => void): () => void;
}

/**
 * ADR-0004: the canvas is created with `alpha: true` (plus premultiplied alpha)
 * so the desktop and DOM glass panels composite through it. The renderer never
 * paints an opaque backdrop.
 */
const RENDERER_CONFIG = {
  alpha: true,
  antialias: true,
  premultipliedAlpha: true,
  powerPreference: "high-performance",
  failIfMajorPerformanceCaveat: false,
} as const;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Creates the shell renderer. One instance, owned by the graphics layer.
 *
 * The frame loop is the single rAF owner (lazy start, stopped on dispose).
 * When a real WebGL context cannot be created (no WebGL2, headless), an inert
 * renderer is returned so the shell stays alive without GPU visuals.
 */
export function createRenderer(options?: RendererOptions): GraphicsRenderer {
  let glRenderer: GLRendererLike;

  if (options?.glRenderer) {
    glRenderer = options.glRenderer;
  } else {
    try {
      const real = new THREE.WebGLRenderer(RENDERER_CONFIG);
      real.setClearColor(0x000000, 0);
      glRenderer = real;
    } catch (error) {
      logError(
        "graphics: WebGL unavailable — running without GPU layer",
        error,
      );
      return createInertRenderer(options?.canvas);
    }
  }

  const scene = createScene();
  const camera = createCamera(1);
  const lights = createLights();
  scene.add(lights.ambient, lights.key);

  // M2.2: optional effects/post-processing composition. Absent = plain scene
  // render, so M2.1 behavior is unchanged. If the composition throws at
  // construction, the renderer still mounts — it degrades to the plain scene
  // render rather than failing the shell.
  let composed: RenderCompose | undefined;
  try {
    composed = options?.compose?.({
      glRenderer,
      scene,
      camera,
      palette: options?.palette,
    });
  } catch (error) {
    logError("graphics: compose init failed — plain scene render", error);
    composed = undefined;
  }

  let running = false;
  let disposed = false;
  // Tracks an explicit owner stop so the media-change listener never restarts
  // the loop against the owner's intent (M1).
  let externallyStopped = false;
  // GFX-005: render skip. Set by start(), resize, applyPalette, and the
  // visibility resume path; cleared only after a successful tick render (a
  // render throw keeps the flag set so the next tick retries). While a
  // composed effect is active the tick always renders (its effects animate),
  // so the flag only gates the plain scene-render path.
  let dirty = true;
  // Mirrors the current `prefers-reduced-motion` state so the visibility
  // resume path never restarts a loop the preference has stopped.
  let reducedMotion = false;
  // Set when the document visibility handler pauses the loop; guards the
  // hidden→visible resume so it never overrides an explicit stop().
  let pausedForVisibility = false;
  let rafId: number | null = null;
  let media: MediaQueryList | null = null;
  let mediaChange: ((event: MediaQueryListEvent) => void) | null = null;
  let visibilityHandler: (() => void) | null = null;

  // GFX-005: windowed FPS meter. Subscribers are notified only on sample
  // (~2/sec), so the per-frame tick stays allocation-free.
  const fpsSubscribers = new Set<(fps: number) => void>();
  const meter = createFpsMeter({
    onSample: (fps: number): void => {
      // ~2 samples/sec — the per-frame tick stays allocation-free.
      fpsSubscribers.forEach((subscriber) => subscriber(fps));
    },
  });

  function subscribeFps(callback: (fps: number) => void): () => void {
    if (disposed) {
      // n4: after dispose the renderer can never sample again — accept the
      // subscription but return an inert unsubscribe.
      return () => {
        // Disposed: nothing to unsubscribe from.
      };
    }
    fpsSubscribers.add(callback);
    return (): void => {
      fpsSubscribers.delete(callback);
    };
  }

  const surface: RenderSurface = {
    canvas: glRenderer.domElement,
    resize(width, height) {
      if (disposed) return;
      if (width <= 0 || height <= 0) return;
      // GFX-005: the backing store changed — the next tick must redraw.
      dirty = true;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      glRenderer.setPixelRatio(1);
      glRenderer.setSize(width, height, false);
      // M2.2: forward the device-pixel size to the composition (composer
      // buffers + aspect-driven uniforms).
      composed?.resize?.(width, height);
      // setSize clears the drawing buffer; under reduced motion (no loop)
      // the static frame must be re-rendered — mirrors applyPalette.
      if (!running) render();
    },
  };

  /** Renders a single frame; safe to call when the loop is not running. */
  function render(): void {
    if (disposed) return;
    if (composed) {
      composed.render();
    } else {
      glRenderer.render(scene, camera);
    }
  }

  /** Starts the rAF loop. The tick body performs zero allocations. */
  function startLoop(): void {
    if (running || disposed) return;
    running = true;
    // M2: the meter must not span the gap since the loop was last stopped —
    // a long pause (visibility resume, media flip, stop→start) would otherwise
    // be folded into one giant delta and produce a sub-1fps garbage sample.
    // reset() preserves the last clean `value`; the FpsMonitor holds it.
    meter.reset();
    // A fresh loop draws on its first tick (and a resumed loop redraws).
    dirty = true;
    const tick = (): void => {
      // Total-termination guard: makes loop cancellation provable even if
      // stop()/dispose() ever ran synchronously inside a tick (ADR-0008 D4).
      if (disposed || !running) return;
      // Schedule the next frame BEFORE rendering, so a render() throw (e.g. a
      // GL hiccup mid-composer) never kills the loop silently.
      rafId = globalThis.requestAnimationFrame(tick);
      // GFX-005: skip the expensive render when nothing changed — the loop
      // stays alive, only the draw is deferred. A composed effect is always
      // dirty: its sub-effects (e.g. drifting particles) animate every frame.
      if (dirty || composed) {
        // M1: clear the flag only AFTER a successful draw — a render throw
        // must leave the tick dirty so the next frame retries instead of
        // freezing the pipeline (the rAF above keeps the loop alive).
        render();
        dirty = false;
        meter.tick(performance.now());
      }
    };
    rafId = globalThis.requestAnimationFrame(tick);
  }

  function stopLoop(): void {
    if (!running) return;
    running = false;
    if (rafId !== null) {
      globalThis.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  const stop = (): void => {
    externallyStopped = true;
    stopLoop();
  };

  /**
   * Lazily wires the `prefers-reduced-motion` media listener. On a
   * reduced-motion change the loop starts/stops accordingly.
   */
  function ensureMediaListener(): MediaQueryList | null {
    if (media) return media;
    if (typeof window.matchMedia !== "function") return null;
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    const listener = (event: MediaQueryListEvent): void => {
      reducedMotion = event.matches;
      if (event.matches) {
        stopLoop();
        render();
      } else if (
        !externallyStopped &&
        // m3: never schedule rAF for a hidden document — the visibility
        // handler owns the hidden→visible resume instead.
        (typeof document === "undefined" ||
          document.visibilityState !== "hidden")
      ) {
        startLoop();
      }
    };
    if (mql.addEventListener) {
      mql.addEventListener("change", listener);
    } else {
      const legacy = mql as unknown as {
        addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      };
      legacy.addListener?.(listener);
    }
    media = mql;
    mediaChange = listener;
    return mql;
  }

  /**
   * GFX-005: pauses the loop while the document is hidden and resumes it on
   * return. rAF is throttled/stopped in hidden tabs anyway, so canceling the
   * handle keeps the lifecycle explicit. The resume only fires when this
   * handler actually paused the loop — an explicit stop() (or the reduced
   * motion preference) is never overridden by a hidden→visible transition.
   */
  function ensureVisibilityListener(): void {
    if (visibilityHandler) return;
    if (typeof document === "undefined") return;
    const handler = (): void => {
      if (document.visibilityState === "hidden") {
        if (running) {
          pausedForVisibility = true;
          stopLoop();
        }
      } else if (pausedForVisibility && !externallyStopped && !reducedMotion) {
        pausedForVisibility = false;
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", handler);
    visibilityHandler = handler;
  }

  function start(): () => void {
    if (disposed) return stop;
    if (running) return stop;
    // An explicit start() re-asserts ownership, so a later preference flip may
    // drive the loop again (until the owner stops once more).
    externallyStopped = false;
    const mql = ensureMediaListener();
    ensureVisibilityListener();
    reducedMotion = mql?.matches ?? false;
    if (mql?.matches) {
      // prefers-reduced-motion: render one static frame, no loop.
      render();
    } else {
      startLoop();
    }
    return stop;
  }

  function applyPalette(palette: ThemePalette): void {
    if (disposed) return;
    // GFX-005: scene colors changed — the next tick must redraw.
    dirty = true;
    // three auto-linearizes hex colors — correct for lights; ColorManagement is
    // left untouched. In-place `.set()` keeps apply zero-allocation.
    lights.ambient.color.set(palette.ambient);
    lights.key.color.set(palette.accent);
    // M2.2: forward the palette to the composition after the lights are
    // pushed, so sub-effects re-tint before any static re-render below.
    composed?.applyPalette?.(palette);
    // When the loop is not running (reduced-motion static frame), re-render once
    // so the frozen frame picks up the palette. The running loop owns rendering
    // in the normal path, so nothing extra happens there.
    if (!running) {
      render();
    }
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    stopLoop();
    // m2: drop FPS subscribers so nothing is notified after teardown.
    fpsSubscribers.clear();
    if (visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", visibilityHandler);
      visibilityHandler = null;
    }
    if (media && mediaChange) {
      if (media.removeEventListener) {
        media.removeEventListener("change", mediaChange);
      } else {
        const legacy = media as unknown as {
          removeListener?: (
            listener: (event: MediaQueryListEvent) => void,
          ) => void;
        };
        legacy.removeListener?.(mediaChange);
      }
      media = null;
      mediaChange = null;
    }
    // M2.2: release the composition (composer + sub-effect resources) before
    // the renderer tears down its own GPU resources. A throw here must never
    // prevent the total teardown below — it is contained in try/catch and the
    // teardown itself is isolated in try/finally.
    try {
      composed?.dispose?.();
    } catch (error) {
      logError("graphics: compose dispose failed", error);
    } finally {
      glRenderer.dispose();
      (
        glRenderer as unknown as { forceContextLoss?: () => void }
      ).forceContextLoss?.();
      const element = glRenderer.domElement;
      element.parentNode?.removeChild(element);
      scene.traverse((object) => {
        const target = object as unknown as {
          geometry?: { dispose(): void };
          material?:
            { dispose(): void } | Array<{ dispose(): void } | undefined>;
        };
        target.geometry?.dispose();
        const material = target.material;
        if (Array.isArray(material)) {
          for (const entry of material) entry?.dispose();
        } else {
          material?.dispose();
        }
      });
      (
        glRenderer as unknown as { renderLists?: { dispose(): void } }
      ).renderLists?.dispose?.();
    }
  }

  return { surface, start, render, applyPalette, dispose, subscribeFps };
}

/** Fallback when no WebGL context can be created — the shell stays alive. */
function createInertRenderer(canvas?: HTMLCanvasElement): GraphicsRenderer {
  const inertCanvas = canvas ?? document.createElement("canvas");
  return {
    surface: {
      canvas: inertCanvas,
      resize(): void {
        // Inert: no GPU, nothing to resize.
      },
    },
    start(): () => void {
      return () => {
        // Inert: no loop to stop.
      };
    },
    render(): void {
      // Inert.
    },
    applyPalette(): void {
      // Inert.
    },
    subscribeFps(): () => void {
      return () => {
        // Inert: nothing to subscribe to.
      };
    },
    dispose(): void {
      inertCanvas.parentNode?.removeChild(inertCanvas);
    },
  };
}
