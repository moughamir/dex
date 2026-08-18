import * as THREE from "three";

/** The scene's light rig: a flat ambient fill plus a directional key light. */
export interface SceneLights {
  ambient: THREE.AmbientLight;
  key: THREE.DirectionalLight;
}

/**
 * Constructs the scene lights. Colors are intentionally left at their defaults
 * here — they are driven by the theme palette via `applyPalette` (ADR-0003),
 * which is pushed by the renderer's owner on theme change.
 */
export function createLights(): SceneLights {
  return {
    ambient: new THREE.AmbientLight(),
    key: new THREE.DirectionalLight(),
  };
}
