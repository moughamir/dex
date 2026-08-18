import * as THREE from "three";
import type { ThemePalette } from "$lib/ui/themes/types";

import {
  BACKGROUND_FRAGMENT,
  BACKGROUND_VERTEX,
} from "../shaders/background.glsl";
import { parseColor } from "./color";

/**
 * The transparent backdrop vignette (M2.2).
 *
 * ADR-0004 hard contract: `scene.background` stays null forever. The backdrop
 * is a shader plane floating at z = -25 (camera far is 100), facing the camera
 * (+z toward origin). The fragment shader normalizes each fragment's
 * view-space position by the frustum half-extents at this depth (`uFrustumHalf`),
 * so the alpha reaches 0 at every window edge and corner — a true screen-space
 * vignette with a subtle center tint (max alpha = the configured opacity,
 * ~0.15 by default). The material writes with NoBlending into the composer
 * render target, so the single final OutputPass blend renders that alpha as
 * specified (a second blend would square it to ~0.02). The desktop shows
 * through everywhere.
 */
export interface BackgroundEffect {
  mesh: THREE.Mesh;
  setFromPalette(palette: ThemePalette): void;
  setAspect(aspect: number): void;
  dispose(): void;
}

// Frustum half-height at the plane's |z| = 25 for the fixed vertical fov 60°
// (camera.ts). Half-width = half-height * aspect.
const FRUSTUM_HALF_AT_BACKDROP = 25 * Math.tan(Math.PI / 6);

export function createBackground(opacity: number): BackgroundEffect {
  const geometry = new THREE.PlaneGeometry(160, 160);
  // Frustum half-extents at z = -25 for the initial aspect 1; setAspect keeps
  // it in sync with the camera on resize (zero-alloc in-place update).
  const frustumHalf = new THREE.Vector2(
    FRUSTUM_HALF_AT_BACKDROP,
    FRUSTUM_HALF_AT_BACKDROP,
  );
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    // NoBlending: the composer's OutputPass re-blends the RT onto the screen,
    // so a second alpha blend here would square the alpha (0.15 → ~0.02).
    // Writing raw (rgb, a) lets the final screen blend render ≈ uOpacity.
    blending: THREE.NoBlending,
    // This IS the backdrop — it must not fog out toward the fog color.
    fog: false,
    uniforms: {
      uColor: { value: new THREE.Color(0x05070b) },
      uOpacity: { value: opacity },
      uFrustumHalf: { value: frustumHalf },
    },
    vertexShader: BACKGROUND_VERTEX,
    fragmentShader: BACKGROUND_FRAGMENT,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -25;

  return {
    mesh,
    setFromPalette(palette) {
      (material.uniforms.uColor.value as THREE.Color).set(
        parseColor(palette.background),
      );
    },
    setAspect(aspect) {
      frustumHalf.set(
        FRUSTUM_HALF_AT_BACKDROP * aspect,
        FRUSTUM_HALF_AT_BACKDROP,
      );
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
