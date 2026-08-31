// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, Scene, Vector2 } from "three";

import {
  createRenderer,
  type ComposeContext,
  type GLRendererLike,
} from "$lib/graphics/renderer";
import type { ThemePalette } from "$lib/ui/themes/types";

let rafCallbacks: FrameRequestCallback[];
let cancelledRafIds: number[];
let nextRafId: number;
// Controllable clock backing performance.now() (the renderer's FPS meter
// samples from it inside the tick).
let now = 0;

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
    getPixelRatio: vi.fn(() => 1),
    getSize: vi.fn(() => new Vector2(1, 1)),
    forceContextLoss: vi.fn(),
    renderLists: { dispose: vi.fn() },
    render: vi.fn(),
    dispose: vi.fn(),
  };
  return { gl, canvas };
}

function createFakeCompose() {
  return {
    render: vi.fn(),
    resize: vi.fn(),
    applyPalette: vi.fn(),
    dispose: vi.fn(),
  };
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
  now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    rafCallbacks.push(callback);
    return nextRafId++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    cancelledRafIds.push(id);
  });
  mockMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  // Undo the instance-level visibilityState override so it never leaks into
  // the next test (the prototype getter keeps providing the default).
  Reflect.deleteProperty(document, "visibilityState");
});

describe("createRenderer", () => {
  it("exposes the injected glRenderer's domElement as the surface canvas", () => {
    const { gl, canvas } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });
    expect(renderer.surface.canvas).toBe(canvas);
  });

  it("start() is idempotent and schedules a rAF loop that renders the first (dirty) frame then idles", () => {
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.start();
    expect(rafCallbacks.length).toBe(1);
    expect(gl.render).not.toHaveBeenCalled();

    // Idempotent: a second start() must not double-schedule.
    renderer.start();
    expect(rafCallbacks.length).toBe(1);

    // Drive one frame: start() marks the loop dirty (GFX-005), so the first
    // tick renders and the loop re-schedules.
    rafCallbacks[0](0);
    expect(gl.render).toHaveBeenCalledTimes(1);
    expect(rafCallbacks.length).toBe(2);

    // Idle tick: nothing changed — the loop stays alive but skips the draw.
    rafCallbacks[1](16);
    expect(gl.render).toHaveBeenCalledTimes(1);
    expect(rafCallbacks.length).toBe(3);

    renderer.dispose();
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

    renderer.dispose();
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
    renderer.dispose();
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

    renderer.dispose();
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

    renderer.dispose();
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

    renderer.dispose();
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

    renderer.dispose();
  });

  it("M3: surface.resize is a no-op after dispose", () => {
    const { gl } = createGlRendererStub();
    const renderer = createRenderer({ glRenderer: gl });

    renderer.dispose();
    renderer.surface.resize(100, 100);
    expect(gl.setPixelRatio).not.toHaveBeenCalled();
    expect(gl.setSize).not.toHaveBeenCalled();
  });

  describe("GFX-005 dirty-flag render skip", () => {
    it("idle ticks skip rendering while the loop keeps scheduling frames", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });

      renderer.start();
      expect(rafCallbacks.length).toBe(1);

      // First tick is dirty (from start()) → renders once.
      rafCallbacks[0](0);
      expect(gl.render).toHaveBeenCalledTimes(1);
      expect(rafCallbacks.length).toBe(2);

      // Idle ticks: nothing changed — no render, but the loop stays alive.
      rafCallbacks[1](16);
      rafCallbacks[2](32);
      rafCallbacks[3](48);
      expect(gl.render).toHaveBeenCalledTimes(1);
      expect(rafCallbacks.length).toBe(5);

      renderer.dispose();
    });

    it("a resize marks dirty so the next tick redraws", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });

      renderer.start();
      rafCallbacks[0](0); // first dirty frame
      expect(gl.render).toHaveBeenCalledTimes(1);

      renderer.surface.resize(800, 600);
      // No synchronous render while the loop is running — just the flag.
      expect(gl.render).toHaveBeenCalledTimes(1);

      rafCallbacks[1](16); // dirty → redraw
      expect(gl.render).toHaveBeenCalledTimes(2);

      rafCallbacks[2](32); // idle again
      expect(gl.render).toHaveBeenCalledTimes(2);

      renderer.dispose();
    });

    it("applyPalette marks dirty so the next tick redraws with the new colors", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });

      renderer.start();
      rafCallbacks[0](0);
      expect(gl.render).toHaveBeenCalledTimes(1);

      renderer.applyPalette(darkPalette());
      expect(gl.render).toHaveBeenCalledTimes(1); // deferred to the tick

      rafCallbacks[1](16);
      expect(gl.render).toHaveBeenCalledTimes(2);

      renderer.dispose();
    });

    it("a composed effect keeps rendering every tick (always dirty)", () => {
      const { gl } = createGlRendererStub();
      const compose = createFakeCompose();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => compose,
      });

      renderer.start();
      rafCallbacks[0](0);
      rafCallbacks[1](16);
      rafCallbacks[2](32);
      expect(compose.render).toHaveBeenCalledTimes(3);
      expect(gl.render).not.toHaveBeenCalled();
      expect(rafCallbacks.length).toBe(4);

      renderer.dispose();
    });

    it("a throwing render keeps the tick dirty so the next frame retries", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });
      renderer.start();

      // The seam allows forcing the draw to throw (M1): the stub's render
      // blows up exactly once, like a transient GL/composer hiccup.
      gl.render.mockImplementationOnce(() => {
        throw new Error("boom");
      });

      // The first tick throws... but the rAF for the next frame was already
      // scheduled before the render, so the loop survives.
      expect(() => rafCallbacks[0](0)).toThrow("boom");
      expect(rafCallbacks.length).toBe(2);

      // The dirty flag was NOT cleared by the failed draw — the next tick
      // redraws instead of freezing the pipeline. (The throwing call counts
      // too, so two render invocations total: the failed one + the retry.)
      rafCallbacks[1](16);
      expect(gl.render).toHaveBeenCalledTimes(2);
      expect(rafCallbacks.length).toBe(3);

      renderer.dispose();
    });
  });

  describe("GFX-005 visibility pause/resume", () => {
    function setVisibility(state: "visible" | "hidden"): void {
      Reflect.defineProperty(document, "visibilityState", {
        configurable: true,
        value: state,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    }

    it("hidden cancels the rAF and visible resumes with a fresh render", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });

      renderer.start();
      rafCallbacks[0](0); // first dirty frame (rafId 2 is pending)
      expect(gl.render).toHaveBeenCalledTimes(1);

      // Hide: the pending frame is cancelled — the loop pauses.
      setVisibility("hidden");
      expect(cancelledRafIds).toContain(2);
      expect(rafCallbacks.length).toBe(2); // nothing re-scheduled while hidden

      // Show: the loop resumes and the next tick redraws (dirty).
      setVisibility("visible");
      expect(rafCallbacks.length).toBe(3);
      rafCallbacks[2](16);
      expect(gl.render).toHaveBeenCalledTimes(2);

      renderer.dispose();
    });

    it("an explicit stop() wins — visible does not resume the loop", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });

      const stop = renderer.start();
      expect(rafCallbacks.length).toBe(1);

      stop();
      expect(cancelledRafIds).toContain(1);

      // Hide then show: the owner's stop must not be overridden.
      setVisibility("hidden");
      setVisibility("visible");
      expect(rafCallbacks.length).toBe(1);
      expect(gl.render).not.toHaveBeenCalled();

      renderer.dispose();
    });

    it("stop() while hidden wins — visible does not resume the loop", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });

      const stop = renderer.start();
      expect(rafCallbacks.length).toBe(1);

      // Hide: the visibility handler pauses the running loop.
      setVisibility("hidden");
      expect(rafCallbacks.length).toBe(1);

      // The owner stops while the document is still hidden.
      stop();
      expect(cancelledRafIds).toContain(1);

      // Show: the explicit stop must still win over the pending resume.
      setVisibility("visible");
      expect(rafCallbacks.length).toBe(1);
      expect(gl.render).not.toHaveBeenCalled();

      renderer.dispose();
    });

    it("a media flip to normal motion never restarts the loop while hidden", () => {
      const mql = mockMatchMedia(false);
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });

      renderer.start();
      expect(rafCallbacks.length).toBe(1);

      const changeListener = mql.addEventListener.mock.calls[0]?.[1] as
        ((event: { matches: boolean }) => void) | undefined;
      expect(changeListener).toBeTypeOf("function");

      // Hide: the visibility handler pauses the loop.
      setVisibility("hidden");
      expect(cancelledRafIds).toContain(1);
      expect(rafCallbacks.length).toBe(1);

      // Preference flips back to normal motion while hidden: a hidden
      // document must never schedule rAF — the resume is the visibility
      // handler's job.
      changeListener?.({ matches: false });
      expect(rafCallbacks.length).toBe(1);

      // Coming back to visible is what actually resumes the loop.
      setVisibility("visible");
      expect(rafCallbacks.length).toBe(2);

      renderer.dispose();
    });

    it("a hidden→visible transition never starts a loop under reduced motion", () => {
      mockMatchMedia(true);
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });

      renderer.start(); // static frame, no loop
      expect(rafCallbacks.length).toBe(0);
      expect(gl.render).toHaveBeenCalledTimes(1);

      setVisibility("hidden");
      setVisibility("visible");
      expect(rafCallbacks.length).toBe(0); // still no loop

      renderer.dispose();
    });

    it("dispose() removes the visibility listener", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });

      renderer.start();
      const removeSpy = vi.spyOn(document, "removeEventListener");
      renderer.dispose();
      expect(removeSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
    });
  });

  describe("GFX-005 subscribeFps", () => {
    it("delivers a windowed FPS sample and unsubscribe stops delivery", () => {
      const { gl } = createGlRendererStub();
      const compose = createFakeCompose();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => compose,
      });
      const samples: number[] = [];
      const unsubscribe = renderer.subscribeFps((fps) => {
        samples.push(fps);
      });
      renderer.start();

      // A composed renderer renders every tick, so every frame feeds the
      // meter. 40 × 16.66ms ticks close a 500ms window: fps ≈ 60.
      for (let i = 0; i < 40; i++) {
        now = i * (1000 / 60);
        rafCallbacks[i](now);
      }
      expect(samples.length).toBe(1);
      expect(samples[0]).toBeCloseTo(60, 0);

      unsubscribe();
      for (let i = 40; i < 80; i++) {
        now = i * (1000 / 60);
        rafCallbacks[i](now);
      }
      expect(samples.length).toBe(1); // no further samples after unsubscribe

      renderer.dispose();
    });

    it("the meter only samples rendered frames — idle ticks emit nothing", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });
      const samples: number[] = [];
      renderer.subscribeFps((fps) => {
        samples.push(fps);
      });
      renderer.start();

      // 40 idle ticks (no resize/applyPalette → one render, then skip).
      for (let i = 0; i < 40; i++) {
        now = i * (1000 / 60);
        rafCallbacks[i](now);
      }
      expect(samples.length).toBe(0);

      renderer.dispose();
    });

    it("M2: resuming the loop opens a fresh FPS window — no pause-gap garbage", () => {
      const { gl } = createGlRendererStub();
      const compose = createFakeCompose();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => compose,
      });
      const samples: number[] = [];
      renderer.subscribeFps((fps) => {
        samples.push(fps);
      });

      // Window 1 at 60fps → one clean sample.
      renderer.start();
      for (let i = 0; i < 40; i++) {
        now = i * (1000 / 60);
        rafCallbacks[i](now);
      }
      expect(samples).toHaveLength(1);
      expect(samples[0]).toBeCloseTo(60, 0);

      // Long pause: the owner stops and restarts a minute later (the shape of
      // a visibility resume or a slow media flip).
      const stop = renderer.start(); // idempotent — grabs the stop handle
      stop();
      now = 60_000;
      renderer.start();

      // The restart must open a fresh window: the first post-resume sample
      // comes from real frames again, not from a giant dead-gap delta.
      let idx = rafCallbacks.length - 1; // the just-scheduled first tick
      for (let j = 0; j < 40; j++) {
        now = 60_000 + j * (1000 / 60);
        rafCallbacks[idx++](now);
      }
      expect(samples).toHaveLength(2);
      expect(samples[1]).toBeCloseTo(60, 0);
      expect(samples[1]).toBeGreaterThan(1); // never a sub-1fps garbage value

      renderer.dispose();
    });

    it("subscribeFps after dispose returns an inert unsubscribe", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({ glRenderer: gl });
      const samples: number[] = [];
      renderer.subscribeFps((fps) => {
        samples.push(fps);
      });
      renderer.start();
      renderer.dispose(); // stops the loop and clears subscribers

      // A post-dispose subscription is accepted but inert — subscribing or
      // unsubscribing must not throw, and no sample can ever arrive.
      const unsubscribe = renderer.subscribeFps((fps) => {
        samples.push(fps);
      });
      unsubscribe();
      expect(samples).toHaveLength(0);
    });
  });

  describe("M2.2 compose seam", () => {
    it("render() delegates to compose.render instead of the plain scene render", () => {
      const { gl } = createGlRendererStub();
      const compose = createFakeCompose();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => compose,
      });

      renderer.render();
      expect(compose.render).toHaveBeenCalledTimes(1);
      expect(gl.render).not.toHaveBeenCalled();
    });

    it("surface.resize forwards the device-pixel size to compose.resize", () => {
      const { gl } = createGlRendererStub();
      const compose = createFakeCompose();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => compose,
      });

      renderer.surface.resize(800, 600);
      expect(compose.resize).toHaveBeenCalledWith(800, 600);
    });

    it("applyPalette forwards the palette to compose.applyPalette", () => {
      const { gl } = createGlRendererStub();
      const compose = createFakeCompose();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => compose,
      });

      const palette = darkPalette();
      renderer.applyPalette(palette);
      expect(compose.applyPalette).toHaveBeenCalledWith(palette);
    });

    it("dispose() forwards to compose.dispose exactly once", () => {
      const { gl } = createGlRendererStub();
      const compose = createFakeCompose();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => compose,
      });

      renderer.dispose();
      renderer.dispose(); // idempotent — compose must not be double-released
      expect(compose.dispose).toHaveBeenCalledTimes(1);
    });

    it("compose receives ctx with scene, camera, glRenderer, and the options palette", () => {
      const { gl } = createGlRendererStub();
      const compose = createFakeCompose();
      const palette = darkPalette();
      let captured: ComposeContext | null = null;

      const renderer = createRenderer({
        glRenderer: gl,
        palette,
        compose: (ctx) => {
          captured = ctx;
          return compose;
        },
      });

      expect(captured).not.toBeNull();
      const ctx = captured as unknown as ComposeContext;
      expect(ctx.glRenderer).toBe(gl);
      expect(ctx.scene).toBeInstanceOf(Scene);
      expect(ctx.camera).toBeInstanceOf(PerspectiveCamera);
      expect(ctx.palette).toBe(palette);

      renderer.dispose();
    });

    it("a compose that returns undefined falls back to the plain scene render", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => undefined,
      });

      renderer.render();
      expect(gl.render).toHaveBeenCalledTimes(1);
      const [scene, camera] = gl.render.mock.calls[0] as [unknown, unknown];
      expect(scene).toBeInstanceOf(Scene);
      expect(camera).toBeInstanceOf(PerspectiveCamera);
    });

    it("a compose that throws at construction still mounts and falls back to the plain scene render", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => {
          throw new Error("boom");
        },
      });

      renderer.render();
      expect(gl.render).toHaveBeenCalledTimes(1);
      const [scene, camera] = gl.render.mock.calls[0] as [unknown, unknown];
      expect(scene).toBeInstanceOf(Scene);
      expect(camera).toBeInstanceOf(PerspectiveCamera);
    });

    it("a compose.dispose that throws must not prevent the glRenderer teardown", () => {
      const { gl } = createGlRendererStub();
      const renderer = createRenderer({
        glRenderer: gl,
        compose: () => ({
          render: vi.fn(),
          dispose: () => {
            throw new Error("boom");
          },
        }),
      });

      renderer.dispose();
      expect(gl.dispose).toHaveBeenCalledTimes(1);
    });
  });
});
