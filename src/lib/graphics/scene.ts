import * as THREE from "three";

/**
 * Creates the renderer's scene root.
 *
 * ADR-0004 hard contract: `scene.background` stays `null` (transparent) so the
 * Wayland desktop and the DOM glass panels composite through the WebGL canvas.
 * The renderer never paints an opaque backdrop.
 */
export function createScene(): THREE.Scene {
  return new THREE.Scene();
}
