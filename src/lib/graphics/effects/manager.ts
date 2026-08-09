import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { ThemePalette } from "$lib/ui/themes/types";

import type { ComposeContext, RenderCompose } from "../renderer";
import type { GLRendererLike } from "../renderer";
import { createBackground, type BackgroundEffect } from "./background";
import { createFog, type FogEffect } from "./fog";
import { createGrid, type GridEffect } from "./grid";
import { createParticles, type ParticleEffect } from "./particles";

/**
 * M2.2 composition root.
 *
 * `createEffects` builds the five effects (bloom/fog/background/grid/particles)
 * into the renderer's scene via the compose seam (`RendererOptions.compose`).
 * The renderer stays the single frame-loop and resource owner: the manager
 * never schedules frames — it only implements `RenderCompose`, which the
 * renderer calls from its own loop, resize, applyPalette, and dispose paths.
 */

/** The minimal composer surface the manager needs (DI seam for tests). */
export interface ComposerLike {
  render(): void;
  setSize(width: number, height: number): void;
  dispose(): void;
}

/** DI seam: builds the bloom composer. Real default = three EffectComposer. */
export type ComposerFactory = (
  glRenderer: GLRendererLike,
  width: number,
  height: number,
) => ComposerLike;

/** Per-effect toggle/tuning; every field optional, merged over defaults. */
export interface EffectsConfig {
  bloom?: {
    enabled?: boolean;
    strength?: number;
    radius?: number;
    threshold?: number;
    composerFactory?: ComposerFactory;
  };
  fog?: { enabled?: boolean; density?: number };
  background?: { enabled?: boolean; opacity?: number };
  grid?: { enabled?: boolean; size?: number; divisions?: number };
  particles?: {
    enabled?: boolean;
    count?: number;
    speed?: number;
    opacity?: number;
  };
}

export const EFFECTS_DEFAULTS = {
  bloom: { enabled: true, strength: 0.4, radius: 0.6, threshold: 0.6 },
  fog: { enabled: true, density: 0.02 },
  background: { enabled: true, opacity: 0.15 },
  grid: { enabled: true, size: 40, divisions: 20 },
  particles: { enabled: true, count: 512, speed: 0.4, opacity: 0.85 },
} as const;

/**
 * Production effects config — the single boot-time toggle point (bloom off =
 * one line). `createEffects` merges it over `EFFECTS_DEFAULTS` internally, so
 * the two stay in sync by construction.
 */
export const EFFECTS_CONFIG: EffectsConfig = {
  bloom: { enabled: true, strength: 0.4, radius: 0.6, threshold: 0.6 },
  fog: { enabled: true, density: 0.02 },
  background: { enabled: true, opacity: 0.15 },
  grid: { enabled: true, size: 40, divisions: 20 },
  particles: { enabled: true, count: 512, speed: 0.4, opacity: 0.85 },
};

/**
 * Builds the production bloom composer: RenderPass → UnrealBloomPass →
 * OutputPass. Exported so tests can assert the pass chain and the blend
 * factors without a GL context.
 *
 * ADR-0004: UnrealBloomPass's blend material defaults to AdditiveBlending,
 * which compiles to `gl.blendFunc(ONE, ONE)` for BOTH rgb and alpha — the
 * `dst.a += bloomAlpha` term would lift the window alpha and paint the glow
 * over the transparent desktop. The blend factors below keep the additive RGB
 * blend (ONE, ONE) while making alpha pass through unchanged (srcAlpha ZERO,
 * dstAlpha ONE). The final OutputPass then writes that alpha through untouched
 * (three r185 OutputShader only transforms `.rgb`; `sRGBTransferOETF` keeps
 * `value.a`).
 */
export function createDefaultComposer(
  gl: GLRendererLike,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  options: { strength: number; radius: number; threshold: number },
): ComposerLike {
  // Initial render-target size from the renderer's current drawing buffer —
  // not a synthetic (1,1). surface.resize re-sizes the composer afterwards.
  const size = gl.getSize(new THREE.Vector2());

  // The library constructor demands a full `THREE.WebGLRenderer`; the GL
  // surface the renderer owns satisfies it structurally. Single cast.
  const composer = new EffectComposer(gl as unknown as THREE.WebGLRenderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(size.width, size.height),
    options.strength,
    options.radius,
    options.threshold,
  );
  bloomPass.blendMaterial.blending = THREE.CustomBlending;
  bloomPass.blendMaterial.blendSrc = THREE.OneFactor;
  bloomPass.blendMaterial.blendDst = THREE.OneFactor;
  bloomPass.blendMaterial.blendSrcAlpha = THREE.ZeroFactor;
  bloomPass.blendMaterial.blendDstAlpha = THREE.OneFactor;
  composer.addPass(bloomPass);

  composer.addPass(new OutputPass());
  return composer;
}

/**
 * Total composer teardown. r185 `EffectComposer.dispose` only releases its
 * render targets and the internal copy pass — NOT the passes added by the
 * caller — so `UnrealBloomPass` (render targets, ~6 materials, fsQuad) would
 * leak without this explicit pass-by-pass disposal.
 */
export function disposeComposer(composer: ComposerLike): void {
  composer.dispose();
  (composer as { passes?: Array<{ dispose?: () => void }> }).passes?.forEach(
    (pass) => pass.dispose?.(),
  );
}

export function createEffects(
  ctx: ComposeContext,
  config: EffectsConfig = {},
): RenderCompose {
  const bloom = { ...EFFECTS_DEFAULTS.bloom, ...config.bloom };
  const fog = { ...EFFECTS_DEFAULTS.fog, ...config.fog };
  const background = { ...EFFECTS_DEFAULTS.background, ...config.background };
  const grid = { ...EFFECTS_DEFAULTS.grid, ...config.grid };
  const particles = { ...EFFECTS_DEFAULTS.particles, ...config.particles };

  // Current palette — initialized from the owner's construction-time palette
  // (if any) and applied so the first composed frame already carries the theme.
  let palette: ThemePalette | null = ctx.palette ?? null;

  let fogEffect: FogEffect | null = null;
  if (fog.enabled) {
    fogEffect = createFog(fog.density);
    ctx.scene.fog = fogEffect.fog;
  }

  let backgroundEffect: BackgroundEffect | null = null;
  if (background.enabled) {
    backgroundEffect = createBackground(background.opacity);
    ctx.scene.add(backgroundEffect.mesh);
  }

  let gridEffect: GridEffect | null = null;
  if (grid.enabled) {
    gridEffect = createGrid(grid.size, grid.divisions);
    ctx.scene.add(gridEffect.object);
  }

  let particlesEffect: ParticleEffect | null = null;
  if (particles.enabled) {
    particlesEffect = createParticles(
      particles.count,
      particles.speed,
      particles.opacity,
    );
    ctx.scene.add(particlesEffect.points);
  }

  let composer: ComposerLike | null = null;
  if (bloom.enabled) {
    const defaultComposer: ComposerFactory = (gl) =>
      createDefaultComposer(gl, ctx.scene, ctx.camera, {
        strength: bloom.strength,
        radius: bloom.radius,
        threshold: bloom.threshold,
      });
    composer = (bloom.composerFactory ?? defaultComposer)(ctx.glRenderer, 1, 1);
  }

  const clock = new THREE.Clock();

  function render(): void {
    particlesEffect?.update(clock.getDelta());
    if (composer) {
      composer.render();
    } else {
      ctx.glRenderer.render(ctx.scene, ctx.camera);
    }
  }

  function resize(width: number, height: number): void {
    composer?.setSize(width, height);
    backgroundEffect?.setAspect(ctx.camera.aspect);
  }

  function applyPalette(next: ThemePalette): void {
    palette = next;
    fogEffect?.setFromPalette(next);
    backgroundEffect?.setFromPalette(next);
    gridEffect?.setFromPalette(next);
    particlesEffect?.setFromPalette(next);
  }

  function dispose(): void {
    if (backgroundEffect) ctx.scene.remove(backgroundEffect.mesh);
    if (gridEffect) ctx.scene.remove(gridEffect.object);
    if (particlesEffect) ctx.scene.remove(particlesEffect.points);
    if (fogEffect) ctx.scene.fog = null;
    if (composer) disposeComposer(composer);
    backgroundEffect?.dispose();
    gridEffect?.dispose();
    particlesEffect?.dispose();
  }

  // The owner's construction-time palette (if any) is applied so the first
  // composed frame already reflects the theme.
  if (palette) applyPalette(palette);

  return { render, resize, applyPalette, dispose };
}
