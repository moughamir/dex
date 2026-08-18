import * as THREE from "three";
import type { ThemePalette } from "$lib/ui/themes/types";

import { parseColor } from "./color";

/** Exponential fog driven by the theme palette (M2.2). */
export interface FogEffect {
  fog: THREE.FogExp2;
  setFromPalette(palette: ThemePalette): void;
}

/**
 * Creates the scene's exponential fog. The color is opaque on purpose — fog
 * blends RGB only (distant geometry fades toward the fog color), so it never
 * affects the window alpha (ADR-0004).
 */
export function createFog(density: number): FogEffect {
  const fog = new THREE.FogExp2(0x05070b, density);
  return {
    fog,
    setFromPalette(palette) {
      fog.color.set(parseColor(palette.fog));
    },
  };
}
