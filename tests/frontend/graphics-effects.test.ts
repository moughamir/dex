import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { createCamera } from "$lib/graphics/camera";
import { createScene } from "$lib/graphics/scene";
import {
  createDefaultComposer,
  createEffects,
  disposeComposer,
} from "$lib/graphics/effects/manager";
import { parseAlpha, parseColor } from "$lib/graphics/effects/color";
import { createParticles } from "$lib/graphics/effects/particles";
import type { GLRendererLike } from "$lib/graphics/renderer";
import { dark } from "$lib/ui/themes/dark";

/**
 * Minimal GLRendererLike stub — no real GL context in the node pool.
 * `getPixelRatio`/`getSize` satisfy EffectComposer's constructor, which reads
 * the drawing-buffer size when default bloom is on.
 */
function createGlStub(): GLRendererLike {
  return {
    domElement: {} as HTMLCanvasElement,
    render: vi.fn(),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    dispose: vi.fn(),
    getPixelRatio: vi.fn(() => 1),
    getSize: vi.fn(() => new THREE.Vector2(1, 1)),
  } as unknown as GLRendererLike;
}

function findChild<T extends THREE.Object3D>(
  scene: THREE.Scene,
  type: string,
): T | undefined {
  return scene.children.find((child) => child.type === type) as T | undefined;
}

describe("createEffects", () => {
  it("default composition adds fog, background, grid, and particles", () => {
    const scene = createScene();
    const camera = createCamera(1);
    const compose = createEffects({
      glRenderer: createGlStub(),
      scene,
      camera,
      palette: dark.palette,
    });

    expect(scene.fog).toBeInstanceOf(THREE.FogExp2);

    // Transparent shader-plane backdrop (ADR-0004): a Mesh with ShaderMaterial.
    const background = findChild<THREE.Mesh>(scene, "Mesh");
    expect(background).toBeDefined();
    expect(background?.material).toBeInstanceOf(THREE.ShaderMaterial);

    // Grid group holding exactly two LineSegments (minor + major).
    const gridGroup = findChild<THREE.Group>(scene, "Group");
    expect(gridGroup).toBeDefined();
    const lines = gridGroup?.children.filter(
      (child) => child.type === "LineSegments",
    );
    expect(lines).toHaveLength(2);

    // Ambient dust.
    const points = findChild<THREE.Points>(scene, "Points");
    expect(points).toBeDefined();
    const position = points?.geometry.getAttribute("position") as
      THREE.BufferAttribute | undefined;
    expect(position?.count).toBe(512);

    // Construction-time palette is applied without an explicit applyPalette
    // call — the first composed frame already carries the theme.
    const fog = scene.fog as THREE.FogExp2;
    expect(fog.color.getHex()).toBe(parseColor(dark.palette.fog).getHex());
  });

  it("renders through the plain scene render when bloom is disabled", () => {
    const gl = createGlStub();
    const scene = createScene();
    const camera = createCamera(1);
    const compose = createEffects(
      { glRenderer: gl, scene, camera },
      { bloom: { enabled: false } },
    );

    compose.render();
    expect(gl.render).toHaveBeenCalledTimes(1);
    expect(gl.render).toHaveBeenCalledWith(scene, camera);
  });

  it("uses the composer factory for bloom and forwards render/resize/dispose", () => {
    const gl = createGlStub();
    const scene = createScene();
    const camera = createCamera(1);
    const fakeComposer = {
      render: vi.fn(),
      setSize: vi.fn(),
      dispose: vi.fn(),
    };
    const factory = vi.fn(() => fakeComposer);

    const compose = createEffects(
      { glRenderer: gl, scene, camera },
      { bloom: { enabled: true, composerFactory: factory } },
    );

    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith(gl, 1, 1);

    compose.render();
    expect(fakeComposer.render).toHaveBeenCalledTimes(1);
    expect(gl.render).not.toHaveBeenCalled();

    compose.resize?.(800, 600);
    expect(fakeComposer.setSize).toHaveBeenCalledWith(800, 600);

    compose.dispose?.();
    expect(fakeComposer.dispose).toHaveBeenCalledTimes(1);
  });

  it("applyPalette tints every sub-effect from the theme palette", () => {
    const scene = createScene();
    const camera = createCamera(1);
    const compose = createEffects({
      glRenderer: createGlStub(),
      scene,
      camera,
    });
    compose.applyPalette?.(dark.palette);

    // Background shader uniform.
    const background = findChild<THREE.Mesh>(scene, "Mesh");
    const uniforms = (background?.material as THREE.ShaderMaterial).uniforms;
    expect((uniforms.uColor.value as THREE.Color).getHex()).toBe(
      parseColor(dark.palette.background).getHex(),
    );

    // Grid minor material: rgba alpha from the string, color from the string.
    const gridGroup = findChild<THREE.Group>(scene, "Group");
    const minor = gridGroup?.children[0] as THREE.LineSegments;
    const minorMaterial = minor.material as THREE.LineBasicMaterial;
    expect(minorMaterial.opacity).toBe(0.05);
    expect(minorMaterial.opacity).toBe(parseAlpha(dark.palette.gridLine));
    expect(minorMaterial.color.getHex()).toBe(
      parseColor(dark.palette.gridLine).getHex(),
    );

    // Particles material color.
    const points = findChild<THREE.Points>(scene, "Points");
    const pointsMaterial = points?.material as THREE.PointsMaterial;
    expect(pointsMaterial.color.getHex()).toBe(
      parseColor(dark.palette.particle).getHex(),
    );

    // Fog color.
    const fog = scene.fog as THREE.FogExp2;
    expect(fog.color.getHex()).toBe(parseColor(dark.palette.fog).getHex());
  });

  it("updates particle positions in place with zero allocations", () => {
    const effect = createParticles(512, 0.4, 0.85);
    const attribute = effect.points.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const arrayBefore = attribute.array as Float32Array;
    const snapshot = Float32Array.from(arrayBefore);

    effect.update(0.016);
    effect.update(0.016);

    // Same attribute and same underlying buffer — nothing reallocated.
    expect(effect.points.geometry.getAttribute("position")).toBe(attribute);
    expect(attribute.array).toBe(arrayBefore);
    // r185: `needsUpdate` is a setter-only flag that bumps `version`; the
    // dirty signal is the version counter moving.
    expect(attribute.version).toBeGreaterThan(0);

    // ...but the positions actually moved.
    let changed = false;
    for (let i = 0; i < arrayBefore.length; i++) {
      if (arrayBefore[i] !== snapshot[i]) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it("dispose removes every effect from the scene and releases resources", () => {
    const scene = createScene();
    const camera = createCamera(1);
    const compose = createEffects({
      glRenderer: createGlStub(),
      scene,
      camera,
    });

    expect(scene.children.length).toBeGreaterThan(0);
    expect(scene.fog).toBeInstanceOf(THREE.FogExp2);

    const background = findChild<THREE.Mesh>(scene, "Mesh");
    const geometryDispose = vi.spyOn(background!.geometry, "dispose");

    compose.dispose?.();

    expect(scene.children).toHaveLength(0);
    expect(scene.fog).toBeNull();
    expect(geometryDispose).toHaveBeenCalledTimes(1);
  });

  it("config gating disables individual effects", () => {
    const scene = createScene();
    const camera = createCamera(1);
    const compose = createEffects(
      { glRenderer: createGlStub(), scene, camera },
      { particles: { enabled: false }, grid: { enabled: false } },
    );

    expect(findChild(scene, "Points")).toBeUndefined();
    expect(findChild(scene, "Group")).toBeUndefined();
    // Background + fog still enabled.
    expect(findChild(scene, "Mesh")).toBeDefined();
    expect(scene.fog).toBeInstanceOf(THREE.FogExp2);
  });

  it("bloom keeps alpha passthrough via custom blend factors (ADR-0004)", () => {
    const scene = createScene();
    const camera = createCamera(1);
    const composer = createDefaultComposer(createGlStub(), scene, camera, {
      strength: 0.4,
      radius: 0.6,
      threshold: 0.6,
    });

    const passes = (composer as unknown as { passes: unknown[] }).passes;
    const bloomPass = passes.find((pass) => pass instanceof UnrealBloomPass) as
      UnrealBloomPass | undefined;
    expect(bloomPass).toBeDefined();

    // AdditiveBlending would compile to gl.blendFunc(ONE, ONE) for alpha too,
    // lifting the window alpha; the manager pins CustomBlending so RGB stays
    // additive (ONE, ONE) while alpha passes through unchanged (ZERO, ONE).
    expect(bloomPass?.blendMaterial.blending).toBe(THREE.CustomBlending);
    expect(bloomPass?.blendMaterial.blendSrc).toBe(THREE.OneFactor);
    expect(bloomPass?.blendMaterial.blendDst).toBe(THREE.OneFactor);
    expect(bloomPass?.blendMaterial.blendSrcAlpha).toBe(THREE.ZeroFactor);
    expect(bloomPass?.blendMaterial.blendDstAlpha).toBe(THREE.OneFactor);
  });

  it("disposeComposer releases every added pass", () => {
    const scene = createScene();
    const camera = createCamera(1);
    const composer = createDefaultComposer(createGlStub(), scene, camera, {
      strength: 0.4,
      radius: 0.6,
      threshold: 0.6,
    });

    const passes = (
      composer as unknown as {
        passes: Array<{ dispose(): void }>;
      }
    ).passes;
    expect(passes.length).toBeGreaterThan(0);
    const spied = passes.map((pass) => vi.spyOn(pass, "dispose"));

    disposeComposer(composer);

    for (const dispose of spied) {
      expect(dispose).toHaveBeenCalledTimes(1);
    }
  });

  it("resize updates the backdrop frustum-half uniform for the camera aspect", () => {
    const scene = createScene();
    const camera = createCamera(1);
    camera.aspect = 16 / 9;
    const compose = createEffects({
      glRenderer: createGlStub(),
      scene,
      camera,
    });

    compose.resize?.(1600, 900);

    const background = findChild<THREE.Mesh>(scene, "Mesh");
    const uniforms = (background?.material as THREE.ShaderMaterial).uniforms;
    const half = uniforms.uFrustumHalf.value as THREE.Vector2;
    const expected = 25 * Math.tan(Math.PI / 6);
    expect(half.x).toBeCloseTo(expected * (16 / 9), 6);
    expect(half.y).toBeCloseTo(expected, 6);
  });
});
