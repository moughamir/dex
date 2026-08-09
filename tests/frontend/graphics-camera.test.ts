import { describe, expect, it } from "vitest";

import { createCamera } from "$lib/graphics/camera";

describe("createCamera", () => {
  it("passes the aspect ratio through", () => {
    expect(createCamera(1.5).aspect).toBe(1.5);
    expect(createCamera(16 / 9).aspect).toBeCloseTo(16 / 9);
  });

  it("uses the fixed fov/near/far defaults", () => {
    const camera = createCamera(1);
    expect(camera.fov).toBe(60);
    expect(camera.near).toBe(0.1);
    expect(camera.far).toBe(100);
  });
});
