/**
 * GLSL for the transparent backdrop vignette plane (M2.2).
 *
 * A true screen-space vignette: the fragment shader maps each fragment's
 * view-space position to normalized coordinates against the frustum half-
 * extents at the plane's depth (uniform `uFrustumHalf`), so every window edge
 * and corner lands at r >= 1 and the alpha reaches 0 there. Center alpha is
 * `uOpacity` (~0.15 by default); the desktop and the DOM glass panels
 * composite through everywhere (ADR-0004) — the backdrop is a shader plane,
 * never `scene.background`.
 *
 * Minimal shaders on purpose — no three `#include` chunks. `position`/`uv`
 * and `modelViewMatrix`/`projectionMatrix` are auto-declared by three for
 * ShaderMaterial.
 */

export const BACKGROUND_VERTEX = /* glsl */ `
varying vec3 vViewPos;

void main() {
  vViewPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const BACKGROUND_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform vec2 uFrustumHalf;

varying vec3 vViewPos;

void main() {
  // View-space position normalized by the frustum half-extents at this depth:
  // any edge point maps to r >= 1 (corners to sqrt(2)), center to r = 0.
  vec2 ndc = vViewPos.xy / uFrustumHalf;
  float r = length(ndc);
  float a = (1.0 - smoothstep(0.35, 1.0, r)) * uOpacity;
  gl_FragColor = vec4(uColor.rgb, a);
}
`;
