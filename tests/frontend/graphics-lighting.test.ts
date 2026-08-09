import { describe, expect, it } from "vitest";
import { AmbientLight, DirectionalLight } from "three";

import { createLights } from "$lib/graphics/lighting";

describe("createLights", () => {
  it("returns an ambient light and a directional key light", () => {
    const { ambient, key } = createLights();
    expect(ambient).toBeInstanceOf(AmbientLight);
    expect(key).toBeInstanceOf(DirectionalLight);
  });

  it("leaves colors at their defaults (palette is applied later via push)", () => {
    const { ambient, key } = createLights();
    expect(ambient.color.getHex()).toBe(0xffffff);
    expect(key.color.getHex()).toBe(0xffffff);
  });
});
