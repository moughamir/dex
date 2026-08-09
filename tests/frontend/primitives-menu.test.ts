// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MenuItem } from "$lib/ui/primitives/menu";

import MenuHarness from "./helpers/MenuHarness.svelte";

interface FakeHandle {
  cancel: ReturnType<typeof vi.fn<() => void>>;
  finish: ReturnType<typeof vi.fn<() => void>>;
  finished: Promise<void>;
  resolve: () => void;
}

interface EnterOptions {
  el: Element;
  kind: "fade" | "pop";
}

interface ExitOptions extends EnterOptions {
  onDone?: () => void;
}

interface MotionCall {
  phase: "enter" | "exit";
  kind: "fade" | "pop";
  el: Element;
  onDone?: ReturnType<typeof vi.fn<() => void>>;
  handle: FakeHandle;
}

/**
 * jsdom has no `Element.animate`, so the motion layer is mocked with
 * controllable handles to assert enter/exit sequencing deterministically.
 * `motion.reduced` emulates the manager gate (real wiring: a matchMedia
 * `(prefers-reduced-motion: reduce)` query drives `MotionManager.reduced`).
 */
const motion = vi.hoisted(() => ({
  enter: vi.fn<(opts: EnterOptions) => FakeHandle>(),
  exit: vi.fn<(opts: ExitOptions) => FakeHandle>(),
  reduced: false,
}));

vi.mock("$lib/ui/motion", () => ({
  transitionManager: {
    enter: motion.enter,
    exit: motion.exit,
  },
}));

const ITEMS: MenuItem[] = [
  { id: "one", label: "One" },
  { id: "two", label: "Two" },
];

let calls: MotionCall[] = [];

function createFakeHandle(): FakeHandle {
  let resolve!: () => void;
  const finished = new Promise<void>((res) => {
    resolve = res;
  });
  return {
    cancel: vi.fn<() => void>(),
    finish: vi.fn<() => void>(),
    finished,
    resolve,
  };
}

function finishedHandle(): FakeHandle {
  return {
    cancel: vi.fn<() => void>(),
    finish: vi.fn<() => void>(),
    finished: Promise.resolve(),
    resolve: () => {},
  };
}

function installMotionMock() {
  calls = [];
  motion.reduced = false;
  motion.enter.mockImplementation((opts: EnterOptions) => {
    const handle = motion.reduced ? finishedHandle() : createFakeHandle();
    calls.push({ phase: "enter", kind: opts.kind, el: opts.el, handle });
    return handle;
  });
  motion.exit.mockImplementation((opts: ExitOptions) => {
    const handle = motion.reduced ? finishedHandle() : createFakeHandle();
    // Mirrors the transition-manager contract: onDone fires exactly once when
    // the animation finishes and is swallowed when the handle is cancelled.
    const onDone = vi.fn<() => void>(() => opts.onDone?.());
    handle.finished.then(onDone, () => {});
    calls.push({ phase: "exit", kind: opts.kind, el: opts.el, onDone, handle });
    return handle;
  });
}

const enterCalls = () => calls.filter((call) => call.phase === "enter");
const exitCalls = () => calls.filter((call) => call.phase === "exit");

describe("Menu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    installMotionMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("renders the menu with items when opened", async () => {
    render(MenuHarness, { items: ITEMS });
    await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await tick();

    const menu = screen.getByRole("menu");
    expect(menu).not.toBeNull();
    expect(
      screen.getAllByRole("menuitem").map((el) => el.textContent?.trim()),
    ).toEqual(["One", "Two"]);
  });

  it("enters with the pop preset when it opens", async () => {
    render(MenuHarness, { items: ITEMS });
    await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await tick();

    const menu = screen.getByRole("menu");
    const enters = enterCalls();
    expect(enters).toHaveLength(1);
    expect(enters[0].kind).toBe("pop");
    expect(enters[0].el).toBe(menu);
  });

  it("keeps the menu mounted while closing and unmounts after the exit finishes", async () => {
    render(MenuHarness, { items: ITEMS });
    await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await tick();

    const menu = screen.getByRole("menu");
    await fireEvent.keyDown(menu, { key: "Escape" });

    // The exit animation runs while the menu stays mounted.
    const exits = exitCalls();
    expect(exits).toHaveLength(1);
    expect(exits[0].kind).toBe("pop");
    expect(exits[0].el).toBe(menu);
    expect(screen.getByRole("menu")).toBe(menu);

    // onDone fires exactly once and unmounts the menu.
    exits[0].handle.resolve();
    await tick();
    await tick();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(exits[0].onDone).toHaveBeenCalledTimes(1);
  });

  it("unmounts immediately on close under reduced motion", async () => {
    // The manager gate (production wiring: matchMedia reduce query → reduced)
    // makes every handle already-finished, so onDone fires without resolution.
    const mql = {
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn(
      () => mql as unknown as MediaQueryList,
    ) as unknown as typeof window.matchMedia;
    motion.reduced = true;

    render(MenuHarness, { items: ITEMS });
    await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    await tick();

    await fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await tick();
    await tick();

    expect(screen.queryByRole("menu")).toBeNull();
  });
});
