// @vitest-environment jsdom
import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { themes } from "$lib/core/config/theme";
import { themeStore } from "$lib/core/stores/theme.svelte";
import GraphicsBackdrop from "$lib/ui/effects/GraphicsBackdrop.svelte";

const mocks = vi.hoisted(() => ({
  createRenderer: vi.fn(),
}));

vi.mock("$lib/graphics/renderer", () => ({
  createRenderer: mocks.createRenderer,
}));

interface FakeRenderer {
  surface: {
    canvas: HTMLCanvasElement;
    resize: ReturnType<typeof vi.fn>;
  };
  start: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
  applyPalette: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

function createFakeRenderer(): FakeRenderer {
  const canvas = document.createElement("canvas");
  return {
    surface: { canvas, resize: vi.fn() },
    start: vi.fn(() => vi.fn()),
    render: vi.fn(),
    applyPalette: vi.fn(),
    dispose: vi.fn(() => {
      // Mirrors the real renderer contract: dispose detaches the canvas.
      canvas.parentNode?.removeChild(canvas);
    }),
  };
}

interface MockMql {
  media: string;
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

describe("GraphicsBackdrop", () => {
  let currentRenderer: FakeRenderer;
  let mql: MockMql;

  beforeEach(() => {
    document.body.innerHTML = "";
    themeStore.apply("dark");

    currentRenderer = createFakeRenderer();
    mocks.createRenderer.mockReturnValue(currentRenderer);

    mql = {
      media: "(resolution: 1dppx)",
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn(
      () => mql as unknown as MediaQueryList,
    ) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    themeStore.reset();
    vi.clearAllMocks();
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("mounts the renderer canvas under the chrome and pushes the initial palette", async () => {
    render(GraphicsBackdrop);
    await tick();

    const { canvas, resize } = currentRenderer.surface;

    // Canvas lives in the transparent -z-50 backdrop container.
    expect(document.body.contains(canvas)).toBe(true);
    expect(canvas.parentElement?.getAttribute("aria-hidden")).toBe("true");
    expect(canvas.parentElement?.className).toContain("-z-50");
    expect(canvas.style.pointerEvents).toBe("none");

    expect(currentRenderer.start).toHaveBeenCalledTimes(1);
    expect(currentRenderer.applyPalette).toHaveBeenCalledWith(
      themeStore.palette,
    );

    // Backing store sized to the window in device pixels.
    expect(resize).toHaveBeenCalledTimes(1);
    const [width, height] = resize.mock.calls[0] as [number, number];
    expect(width).toBeGreaterThanOrEqual(1);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  it("re-sizes the backing store on window resize and detaches the listener on unmount", async () => {
    const { unmount } = render(GraphicsBackdrop);
    await tick();

    expect(currentRenderer.surface.resize).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("resize"));
    expect(currentRenderer.surface.resize).toHaveBeenCalledTimes(2);

    unmount();
    await tick();

    // The resize listener is removed on teardown — no further resizes.
    window.dispatchEvent(new Event("resize"));
    expect(currentRenderer.surface.resize).toHaveBeenCalledTimes(2);
  });

  it("re-sizes the backing store when the devicePixelRatio changes", async () => {
    render(GraphicsBackdrop);
    await tick();

    expect(mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    const changeHandler = mql.addEventListener.mock.calls[0]?.[1] as () => void;
    changeHandler();
    expect(currentRenderer.surface.resize).toHaveBeenCalledTimes(2);
  });

  it("pushes the new palette on theme change (ADR-0003)", async () => {
    render(GraphicsBackdrop);
    await tick();

    themeStore.apply("light");
    await tick();

    expect(currentRenderer.applyPalette).toHaveBeenCalledTimes(2);
    expect(currentRenderer.applyPalette).toHaveBeenLastCalledWith(
      themes.light.palette,
    );
  });

  it("disposes the renderer, stops the loop, and removes the canvas on unmount", async () => {
    const { unmount } = render(GraphicsBackdrop);
    await tick();

    const { canvas } = currentRenderer.surface;
    const stop = currentRenderer.start.mock.results[0]?.value as () => void;

    unmount();
    await tick();

    expect(currentRenderer.dispose).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(document.body.contains(canvas)).toBe(false);
  });
});
