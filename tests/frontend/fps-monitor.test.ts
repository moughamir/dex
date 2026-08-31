// @vitest-environment jsdom
import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import FpsMonitor from "$lib/ui/effects/FpsMonitor.svelte";

type FpsCallback = (fps: number) => void;

interface FakeFpsSource {
  subscribeFps(callback: FpsCallback): () => void;
}

/** Captures the subscription callback so tests can emit samples on demand. */
function createFakeSource(): {
  source: FakeFpsSource;
  emit: FpsCallback;
  unsubscribe: ReturnType<typeof vi.fn>;
} {
  let callback: FpsCallback | null = null;
  const unsubscribe = vi.fn();
  const source: FakeFpsSource = {
    subscribeFps: vi.fn((cb: FpsCallback) => {
      callback = cb;
      return unsubscribe;
    }),
  };
  return {
    source,
    emit: (fps: number) => callback?.(fps),
    unsubscribe,
  };
}

describe("FpsMonitor", () => {
  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("renders a neutral placeholder before any sample exists", async () => {
    render(FpsMonitor, { renderer: null });
    await tick();

    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByLabelText("Frames per second")).toBeTruthy();
  });

  it("subscribes to the renderer and shows the rounded FPS", async () => {
    const { source, emit } = createFakeSource();
    render(FpsMonitor, { renderer: source });
    await tick();

    expect(source.subscribeFps).toHaveBeenCalledTimes(1);
    expect(screen.getByText("—")).toBeTruthy();

    emit(59.6);
    await tick();

    expect(screen.getByText("60 fps")).toBeTruthy();
    expect(screen.queryByText("—")).toBeNull();
  });

  it("unsubscribes exactly once on unmount", async () => {
    const { source, unsubscribe } = createFakeSource();
    const { unmount } = render(FpsMonitor, { renderer: source });
    await tick();

    expect(unsubscribe).not.toHaveBeenCalled();

    unmount();
    await tick();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("starts showing samples once a renderer arrives", async () => {
    const { source, emit } = createFakeSource();
    const { rerender } = render(FpsMonitor, { renderer: null });
    await tick();

    expect(screen.getByText("—")).toBeTruthy();
    expect(source.subscribeFps).not.toHaveBeenCalled();

    rerender({ renderer: source });
    await tick();

    expect(source.subscribeFps).toHaveBeenCalledTimes(1);
    emit(59.6);
    await tick();

    expect(screen.getByText("60 fps")).toBeTruthy();
  });
});
