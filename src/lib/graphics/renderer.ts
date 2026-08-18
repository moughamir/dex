import * as THREE from "three";
import { logError } from "$lib/core/utils/logger";
import type { ThemePalette } from "$lib/ui/themes/types";
import { createCamera } from "./camera";
import type { Renderer, RenderSurface } from "./contracts";
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
  let rafId: number | null = null;
  let media: MediaQueryList | null = null;
  let mediaChange: ((event: MediaQueryListEvent) => void) | null = null;

  const surface: RenderSurface = {
    canvas: glRenderer.domElement,
    resize(width, height) {
      if (disposed) return;
      if (width <= 0 || height <= 0) return;
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
    const tick = (): void => {
      // Total-termination guard: makes loop cancellation provable even if
      // stop()/dispose() ever ran synchronously inside a tick (ADR-0008 D4).
      if (disposed || !running) return;
      // Schedule the next frame BEFORE rendering, so a render() throw (e.g. a
      // GL hiccup mid-composer) never kills the loop silently.
      rafId = globalThis.requestAnimationFrame(tick);
      render();
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
      if (event.matches) {
        stopLoop();
        render();
      } else if (!externallyStopped) {
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

  function start(): () => void {
    if (disposed) return stop;
    if (running) return stop;
    // An explicit start() re-asserts ownership, so a later preference flip may
    // drive the loop again (until the owner stops once more).
    externallyStopped = false;
    const mql = ensureMediaListener();
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

  return { surface, start, render, applyPalette, dispose };
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
    dispose(): void {
      inertCanvas.parentNode?.removeChild(inertCanvas);
    },
  };
}
