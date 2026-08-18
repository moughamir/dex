/**
 * Rendering engine contracts — Phase 0 (ADR-0001 §6, ADR-0004 §4).
 *
 * Engine-agnostic on purpose: Three.js (M2.1, ADR-0008) implements these
 * contracts inside `graphics/`; consumers (ui/, features/) depend on the
 * contracts, never on WebGL/Three.js directly. The renderer owns its frame
 * loop, resources, and lifecycle — nothing outside this module may touch
 * the canvas context.
 */

/** RGBA color in 0..1 space, as used by GPU code. */
export interface RgbaColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

/**
 * The drawing surface. Must stay transparent (alpha: true) so the Wayland
 * desktop and DOM glass panels composite through it (ADR-0004).
 */
export interface RenderSurface {
  /** Canvas the renderer draws into. */
  readonly canvas: HTMLCanvasElement;
  /** Resizes the backing store in device pixels (DPR-aware). */
  resize(width: number, height: number): void;
}

/**
 * The shell renderer. One instance, owned by the graphics layer; started on
 * first visual need (lazy), stopped on dispose.
 */
export interface Renderer {
  readonly surface: RenderSurface;
  /** Starts the render loop; returns a stop() handle. */
  start(): () => void;
  /** Renders a single frame (DPR changes, headless tests). */
  render(): void;
  /** Stops the loop and releases GPU resources. Unusable afterwards. */
  dispose(): void;
}
