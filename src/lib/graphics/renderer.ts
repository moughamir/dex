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
>;

export interface RendererOptions {
  /** Optional canvas; defaults to the renderer's own `domElement`. */
  canvas?: HTMLCanvasElement;
  /** DI seam for headless tests — never constructed when provided. */
  glRenderer?: GLRendererLike;
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
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      glRenderer.setPixelRatio(1);
      glRenderer.setSize(width, height, false);
    },
  };

  /** Renders a single frame; safe to call when the loop is not running. */
  function render(): void {
    if (disposed) return;
    glRenderer.render(scene, camera);
  }

  /** Starts the rAF loop. The tick body performs zero allocations. */
  function startLoop(): void {
    if (running || disposed) return;
    running = true;
    const tick = (): void => {
      render();
      rafId = globalThis.requestAnimationFrame(tick);
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
    glRenderer.dispose();
    (
      glRenderer as unknown as { forceContextLoss?: () => void }
    ).forceContextLoss?.();
    const element = glRenderer.domElement;
    element.parentNode?.removeChild(element);
    scene.traverse((object) => {
      const target = object as unknown as {
        geometry?: { dispose(): void };
        material?: { dispose(): void } | Array<{ dispose(): void } | undefined>;
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
