import { describe, expect, it } from "vitest";

import { createScene } from "$lib/graphics/scene";

describe("createScene", () => {
  it("returns a THREE.Scene", () => {
    const scene = createScene();
    expect(scene).toBeDefined();
    expect(scene.type).toBe("Scene");
    expect(scene.isScene).toBe(true);
  });

  it("keeps the background null (transparent — ADR-0004)", () => {
    const scene = createScene();
    expect(scene.background).toBeNull();
  });
});
