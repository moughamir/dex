// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, Scene } from "three";

import { createRenderer, type GLRendererLike } from "$lib/graphics/renderer";
import type { ThemePalette } from "$lib/ui/themes/types";

let rafCallbacks: FrameRequestCallback[];
let cancelledRafIds: number[];
let nextRafId: number;

interface MockMatchMedia {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function mockMatchMedia(matches: boolean): MockMatchMedia {
  const mql: MockMatchMedia = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );
  return mql;
}

interface GlStub {
  gl: GLRendererLike & {
    render: ReturnType<typeof vi.fn>;
    forceContextLoss: ReturnType<typeof vi.fn>;
    renderLists: { dispose: ReturnType<typeof vi.fn> };
  };
  canvas: HTMLCanvasElement;
}

function createGlRendererStub(): GlStub {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  const gl = {
    domElement: canvas,
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    setClearColor: vi.fn(),
    forceContextLoss: vi.fn(),
    renderLists: { dispose: vi.fn() },
    render: vi.fn(),
    dispose: vi.fn(),
  };
  return { gl, canvas };
}

function darkPalette(): ThemePalette {
  return {
    name: "dark",
    accent: "#556677",
    accentStrong: "#667788",
    background: "#101014",
    surface1: "#181820",
    surface2: "#20202a",
    surface3: "#282834",
    text1: "#e8e8ef",
    text2: "#a0a0b0",
    border: "#30303c",
    gridLine: "#2a2a36",
    gridGlow: "#3a5a7a",
    ambient: "#112233",
    fog: "#0c0c12",
    particle: "#88aacc",
    particleGlow: "#446688",
    selection: "#4a6a8a",
    success: "#5aa87a",
    warning: "#c8a85a",
    danger: "#c85a5a",
  };
}

beforeEach(() => {
  document.body.innerHTML = "";
  rafCallbacks = [];
  cancelledRafIds = [];
  nextRafId = 1;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    rafCallbacks.push(callback);
    return nextRafId++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    cancelledRafIds.push(id);
  });
  mockMatchMedia(false);
});

describe("createRenderer", () => {
  it("exposes the injected glRenderer's domElement as the surface canvas", () => {
    const { gl, canvas } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });
    expect(renderer.surface.canvas).toBe(canvas);
  });

  it("start() is idempotent and schedules a rAF loop that renders per tick", () => {
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.start();
    expect(rafCallbacks.length).toBe(1);
    expect(gl.render).not.toHaveBeenCalled();

    // Idempotent: a second start() must not double-schedule.
    renderer.start();
    expect(rafCallbacks.length).toBe(1);

    // Drive one frame: render is called and the loop re-schedules.
    rafCallbacks[0](0);
    expect(gl.render).toHaveBeenCalledTimes(1);
    expect(rafCallbacks.length).toBe(2);

    rafCallbacks[1](16);
    expect(gl.render).toHaveBeenCalledTimes(2);
    expect(rafCallbacks.length).toBe(3);
  });

  it("start() returns a stop() that cancels the pending rAF", () => {
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    const stop = renderer.start();
    expect(rafCallbacks.length).toBe(1);

    stop();
    expect(cancelledRafIds).toEqual([1]);
    expect(rafCallbacks.length).toBe(1); // nothing re-scheduled
    expect(gl.render).not.toHaveBeenCalled();
  });

  it("render() calls glRenderer.render with the composed scene and camera", () => {
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.render();
    expect(gl.render).toHaveBeenCalledTimes(1);
    const [scene, camera] = gl.render.mock.calls[0] as [unknown, unknown];
    expect(scene).toBeInstanceOf(Scene);
    expect(camera).toBeInstanceOf(PerspectiveCamera);
  });

  it("surface.resize updates the camera aspect and sizes the backing store in device pixels", () => {
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.surface.resize(800, 600);
    expect(gl.setPixelRatio).toHaveBeenCalledWith(1);
    expect(gl.setSize).toHaveBeenCalledWith(800, 600, false);

    renderer.render();
    const [, camera] = gl.render.mock.calls[0] as [unknown, { aspect: number }];
    expect(camera.aspect).toBeCloseTo(800 / 600);
  });

  it("applyPalette pushes ambient + accent onto the scene lights", () => {
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.applyPalette(darkPalette());

    renderer.render();
    const [scene] = gl.render.mock.calls[0] as [
      { children: Array<{ type: string; color: { getHex(): number } }> },
      unknown,
    ];
    const ambient = scene.children.find(
      (child) => child.type === "AmbientLight",
    );
    const key = scene.children.find(
      (child) => child.type === "DirectionalLight",
    );
    expect(ambient?.color.getHex()).toBe(0x112233);
    expect(key?.color.getHex()).toBe(0x556677);
  });

  it("dispose() cancels the loop, disposes GPU resources, removes the canvas, and is idempotent", () => {
    const mql = mockMatchMedia(false);
    const { gl, canvas } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.start();
    expect(document.body.contains(canvas)).toBe(true);

    renderer.dispose();
    expect(cancelledRafIds).toContain(1);
    expect(gl.dispose).toHaveBeenCalledTimes(1);
    expect(gl.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(gl.renderLists.dispose).toHaveBeenCalledTimes(1);
    expect(mql.removeEventListener).toHaveBeenCalled();
    expect(document.body.contains(canvas)).toBe(false);

    // Idempotent: a second dispose is a no-op.
    renderer.dispose();
    expect(gl.dispose).toHaveBeenCalledTimes(1);
  });

  it("start() after dispose is a no-op", () => {
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.dispose();
    const stop = renderer.start();
    expect(rafCallbacks.length).toBe(0);
    expect(stop).toBeTypeOf("function");
  });

  it("with reduced motion renders one static frame and never schedules rAF", () => {
    mockMatchMedia(true);
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    const stop = renderer.start();
    expect(gl.render).toHaveBeenCalledTimes(1);
    expect(rafCallbacks.length).toBe(0);
    expect(stop).toBeTypeOf("function");
    stop(); // the no-op stop must not throw
  });

  it("starts/stops the loop when the reduced-motion preference changes", () => {
    const mql = mockMatchMedia(false);
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.start();
    expect(rafCallbacks.length).toBe(1);
    expect(gl.render).not.toHaveBeenCalled();

    const changeListener = mql.addEventListener.mock.calls[0]?.[1] as
      ((event: { matches: boolean }) => void) | undefined;
    expect(changeListener).toBeTypeOf("function");

    // Enter reduced motion: the loop stops and one static frame renders.
    changeListener?.({ matches: true });
    expect(gl.render).toHaveBeenCalledTimes(1);
    expect(rafCallbacks.length).toBe(1); // no re-schedule
    expect(cancelledRafIds).toContain(1);

    // Leave reduced motion: the loop resumes.
    changeListener?.({ matches: false });
    expect(rafCallbacks.length).toBe(2);
  });

  it("M1: an explicit stop() wins over a reduced-motion preference flip", () => {
    const mql = mockMatchMedia(false);
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    const stop = renderer.start();
    expect(rafCallbacks.length).toBe(1);

    stop();
    expect(cancelledRafIds).toContain(1);

    const changeListener = mql.addEventListener.mock.calls[0]?.[1] as
      ((event: { matches: boolean }) => void) | undefined;
    expect(changeListener).toBeTypeOf("function");

    // Preference flip back to normal motion must NOT restart the loop after an
    // explicit stop — the owner's intent wins.
    changeListener?.({ matches: false });
    expect(rafCallbacks.length).toBe(1);
    expect(gl.render).not.toHaveBeenCalled();

    // A later explicit start() re-asserts ownership and restarts the loop.
    const stop2 = renderer.start();
    expect(rafCallbacks.length).toBe(2);

    // ...and a subsequent stop still wins over a preference flip.
    stop2();
    expect(cancelledRafIds).toContain(2);
    changeListener?.({ matches: false });
    expect(rafCallbacks.length).toBe(2);
    expect(gl.render).not.toHaveBeenCalled();
  });

  it("M2: applyPalette re-renders the reduced-motion static frame", () => {
    mockMatchMedia(true);
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.start();
    expect(gl.render).toHaveBeenCalledTimes(1);

    // The loop is not running, so the palette push must re-render the frozen frame.
    renderer.applyPalette(darkPalette());
    expect(gl.render).toHaveBeenCalledTimes(2);
  });

  it("M2: applyPalette does not render synchronously while the loop is running", () => {
    mockMatchMedia(false);
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.start();
    renderer.applyPalette(darkPalette());
    expect(gl.render).not.toHaveBeenCalled();

    // The loop owns rendering: the next tick draws with the new palette.
    rafCallbacks[0](0);
    expect(gl.render).toHaveBeenCalledTimes(1);
  });

  it("M3: surface.resize is a no-op after dispose", () => {
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.dispose();
    renderer.surface.resize(100, 100);
    expect(gl.setPixelRatio).not.toHaveBeenCalled();
    expect(gl.setSize).not.toHaveBeenCalled();
  });
});
