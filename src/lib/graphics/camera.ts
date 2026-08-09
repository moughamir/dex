import * as THREE from "three";

/**
 * Creates the renderer's perspective camera.
 *
 * Fixed intrinsics: fov 60°, near 0.1, far 100. The aspect is supplied by the
 * caller (the renderer derives it from the device-pixel backing store on every
 * `surface.resize`).
 */
export function createCamera(aspectRatio: number): THREE.PerspectiveCamera {
  return new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 100);
}
