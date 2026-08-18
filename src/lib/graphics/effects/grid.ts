import * as THREE from "three";
import type { ThemePalette } from "$lib/ui/themes/types";

import { parseAlpha, parseColor } from "./color";

/**
 * Custom palette-driven floor grid (M2.2).
 *
 * A horizontal XZ grid at y = -2 beneath the camera at origin. Two
 * `LineSegments` share a Group: a minor pass with every line (dim, from
 * `palette.gridLine`) and a major pass with every 5th line plus the center
 * axes (accent, from `palette.gridGlow`). LineBasicMaterial supports fog by
 * default, so distant lines fade toward the fog color.
 */
export interface GridEffect {
  object: THREE.Object3D;
  setFromPalette(palette: ThemePalette): void;
  dispose(): void;
}

/** Builds a line-pair `BufferGeometry` from a flat segment list. */
function buildGeometry(positions: number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return geometry;
}

export function createGrid(size: number, divisions: number): GridEffect {
  const half = size / 2;
  const step = size / divisions;

  const minorPositions: number[] = [];
  const majorPositions: number[] = [];

  // Lines along X at each z step.
  for (let i = 0; i <= divisions; i++) {
    const z = -half + i * step;
    const target = i % 5 === 0 ? majorPositions : minorPositions;
    target.push(-half, 0, z, half, 0, z);
  }
  // Lines along Z at each x step.
  for (let i = 0; i <= divisions; i++) {
    const x = -half + i * step;
    const target = i % 5 === 0 ? majorPositions : minorPositions;
    target.push(x, 0, -half, x, 0, half);
  }

  const minorGeometry = buildGeometry(minorPositions);
  const majorGeometry = buildGeometry(majorPositions);

  // LineBasicMaterial defaults keep `fog: true` so distant lines fade.
  // NoBlending: the composer's final OutputPass blend renders the palette
  // alphas as specified — a second blend through the RT would square them.
  const minorMaterial = new THREE.LineBasicMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.NoBlending,
  });
  const majorMaterial = new THREE.LineBasicMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.NoBlending,
  });

  const minor = new THREE.LineSegments(minorGeometry, minorMaterial);
  const major = new THREE.LineSegments(majorGeometry, majorMaterial);

  const group = new THREE.Group();
  group.position.y = -2;
  group.add(minor, major);

  return {
    object: group,
    setFromPalette(palette) {
      minorMaterial.color.set(parseColor(palette.gridLine));
      minorMaterial.opacity = parseAlpha(palette.gridLine);
      majorMaterial.color.set(parseColor(palette.gridGlow));
      majorMaterial.opacity = parseAlpha(palette.gridGlow);
    },
    dispose() {
      minorGeometry.dispose();
      majorGeometry.dispose();
      minorMaterial.dispose();
      majorMaterial.dispose();
    },
  };
}
