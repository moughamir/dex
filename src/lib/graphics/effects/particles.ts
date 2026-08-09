import * as THREE from "three";
import type { ThemePalette } from "$lib/ui/themes/types";

import { parseColor } from "./color";

/**
 * The X/Z extents of the particle drift box (between the camera and the
 * backdrop plane). Y is not symmetric — the dust drifts slightly above and
 * below the camera.
 */
const BOX_X_MIN = -22;
const BOX_X_MAX = 22;
const BOX_Y_MIN = -6;
const BOX_Y_MAX = 9;
const BOX_Z_MIN = -18;
const BOX_Z_MAX = -5;

/** Ambient dust drifting between the camera and the backdrop (M2.2). */
export interface ParticleEffect {
  points: THREE.Points;
  update(deltaSeconds: number): void;
  setFromPalette(palette: ThemePalette): void;
  dispose(): void;
}

/** Random float in [min, max). */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Periodic wrap of `value` into [min, max). */
function wrap(value: number, min: number, max: number): number {
  const range = max - min;
  let v = (value - min) % range;
  if (v < 0) v += range;
  return v + min;
}

/**
 * Creates the ambient dust. `update(deltaSeconds)` advances the preallocated
 * position array in place — zero per-frame allocations. The dust animates only
 * while the renderer's loop runs; under reduced motion the renderer renders
 * one static frame (update may receive one large dt — harmless, single frame).
 */
export function createParticles(
  count: number,
  speed: number,
  opacity: number,
): ParticleEffect {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(BOX_X_MIN, BOX_X_MAX);
    positions[i * 3 + 1] = rand(BOX_Y_MIN, BOX_Y_MAX);
    positions[i * 3 + 2] = rand(BOX_Z_MIN, BOX_Z_MAX);
    velocities[i * 3] = rand(-speed, speed);
    velocities[i * 3 + 1] = rand(-speed, speed);
    velocities[i * 3 + 2] = rand(-speed, speed);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // NoBlending (NOT NormalBlending): writing raw (rgb, a) into the composer
  // render target means the single final OutputPass blend dims the points by
  // the palette alpha as specified — a double blend would square it. The
  // bright color gives the bloom pass its luminance signal.
  const material = new THREE.PointsMaterial({
    color: 0x5ddcff,
    size: 0.35,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    depthWrite: false,
    fog: true,
    blending: THREE.NoBlending,
  });

  const points = new THREE.Points(geometry, material);
  const positionAttribute = geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;

  return {
    points,
    update(deltaSeconds) {
      for (let i = 0; i < count; i++) {
        const x = positions[i * 3] + velocities[i * 3] * deltaSeconds;
        const y = positions[i * 3 + 1] + velocities[i * 3 + 1] * deltaSeconds;
        const z = positions[i * 3 + 2] + velocities[i * 3 + 2] * deltaSeconds;
        positions[i * 3] = wrap(x, BOX_X_MIN, BOX_X_MAX);
        positions[i * 3 + 1] = wrap(y, BOX_Y_MIN, BOX_Y_MAX);
        positions[i * 3 + 2] = wrap(z, BOX_Z_MIN, BOX_Z_MAX);
      }
      positionAttribute.needsUpdate = true;
    },
    setFromPalette(palette) {
      material.color.set(parseColor(palette.particle));
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
