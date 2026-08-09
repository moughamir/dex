// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Modal from "$lib/ui/primitives/Modal.svelte";
import ModalHarness from "./helpers/ModalHarness.svelte";

interface FakeHandle {
  cancel: ReturnType<typeof vi.fn<() => void>>;
  finish: ReturnType<typeof vi.fn<() => void>>;
  finished: Promise<void>;
  resolve: () => void;
  reject: () => void;
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

let calls: MotionCall[] = [];

function createFakeHandle(rejectOnCancel = false): FakeHandle {
  let resolve!: () => void;
  let reject!: () => void;
  const finished = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    // Real WAAPI semantics: animation.cancel() rejects animation.finished
    // (the transition-manager swallows the rejection, so onDone never fires
    // for a cancelled exit). The no-op default keeps legacy tests simple;
    // the reopen-mid-close test opts into the rejecting variant so a deleted
    // Modal-cleanup cancel() would actually fail.
    cancel: vi.fn(() => {
      if (rejectOnCancel) reject();
    }),
    finish: vi.fn<() => void>(),
    finished,
    resolve,
    reject,
  };
}

function finishedHandle(): FakeHandle {
  return {
    cancel: vi.fn<() => void>(),
    finish: vi.fn<() => void>(),
    finished: Promise.resolve(),
    resolve: () => {},
    reject: () => {},
  };
}

function installMotionMock(options: { rejectOnCancel?: boolean } = {}) {
  calls = [];
  motion.reduced = false;
  const rejectOnCancel = options.rejectOnCancel ?? false;
  motion.enter.mockImplementation((opts: EnterOptions) => {
    const handle = motion.reduced
      ? finishedHandle()
      : createFakeHandle(rejectOnCancel);
    calls.push({ phase: "enter", kind: opts.kind, el: opts.el, handle });
    return handle;
  });
  motion.exit.mockImplementation((opts: ExitOptions) => {
    const handle = motion.reduced
      ? finishedHandle()
      : createFakeHandle(rejectOnCancel);
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

/** Resolve every pending exit so the modal can finish closing. */
async function settleClose() {
  for (const call of exitCalls()) call.handle.resolve();
  await tick();
  await tick();
}

describe("Modal", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    installMotionMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("renders a dialog with the title when open is true", () => {
    render(Modal, { open: true, title: "Delete workspace?" });

    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Delete workspace?")).not.toBeNull();
  });

  it("does not render when open is false", () => {
    render(Modal, { open: false, title: "Delete workspace?" });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("fires onclose when Escape is pressed", async () => {
    const onclose = vi.fn();
    render(Modal, { open: true, title: "Delete workspace?", onclose });

    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it("fires onclose on backdrop pointerdown", async () => {
    const onclose = vi.fn();
    render(Modal, { open: true, title: "Delete workspace?", onclose });

    const backdrop = screen.getByRole("dialog").parentElement!;
    await fireEvent.pointerDown(backdrop);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the dialog when it opens", async () => {
    render(ModalHarness);
    await fireEvent.click(screen.getByRole("button", { name: "Open modal" }));
    await tick();

    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("restores focus to the trigger when it closes", async () => {
    render(ModalHarness);
    const trigger = screen.getByRole("button", { name: "Open modal" });
    trigger.focus();

    await fireEvent.click(trigger);
    await tick();
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await settleClose();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("enters with pop on the surface and fade on the backdrop when opened", async () => {
    render(ModalHarness);
    await fireEvent.click(screen.getByRole("button", { name: "Open modal" }));
    await tick();

    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement!;
    const enters = enterCalls();
    expect(enters).toHaveLength(2);
    expect(enters.find((call) => call.kind === "pop")?.el).toBe(dialog);
    expect(enters.find((call) => call.kind === "fade")?.el).toBe(backdrop);
  });

  it("keeps the surface mounted while closing and unmounts only after both exits finish", async () => {
    render(ModalHarness);
    await fireEvent.click(screen.getByRole("button", { name: "Open modal" }));
    await tick();

    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement!;

    await fireEvent.keyDown(dialog, { key: "Escape" });

    // Exit animations run while the element stays mounted.
    const exits = exitCalls();
    expect(exits).toHaveLength(2);
    expect(exits.find((call) => call.kind === "pop")?.el).toBe(dialog);
    expect(exits.find((call) => call.kind === "fade")?.el).toBe(backdrop);
    expect(screen.getByRole("dialog")).toBe(dialog);

    // A single finished exit keeps the modal mounted.
    exits[0].handle.resolve();
    await tick();
    expect(screen.getByRole("dialog")).toBe(dialog);

    // Both exits finished → each onDone fires exactly once → unmount.
    exits[1].handle.resolve();
    await tick();
    await tick();
    expect(screen.queryByRole("dialog")).toBeNull();
    for (const call of exits) {
      expect(call.onDone).toHaveBeenCalledTimes(1);
    }
  });

  it("reopens mid-close: stale exit handles are cancelled and never fire onDone", async () => {
    // Cancel-rejecting mock: a deleted Modal-cleanup cancel() must fail here,
    // otherwise the stale exit would keep the phase machine stuck or fire
    // onDone late. Real WAAPI cancel() rejects finished — this mirrors it.
    installMotionMock({ rejectOnCancel: true });
    render(ModalHarness);
    const trigger = screen.getByRole("button", { name: "Open modal" });
    await fireEvent.click(trigger);
    await tick();
    const dialog = screen.getByRole("dialog");

    // Start closing, then reopen before the exits finish.
    await fireEvent.keyDown(dialog, { key: "Escape" });
    await tick();
    const exits = exitCalls();
    expect(exits).toHaveLength(2);

    await fireEvent.click(trigger);
    await tick();

    // The stale exit handles were cancelled by the reopen (Modal cleanup) —
    // if the cleanup's handle.cancel() calls were deleted, this fails.
    for (const call of exits) {
      expect(call.handle.cancel).toHaveBeenCalledTimes(1);
    }
    // Cancelled exits never fire onDone → the reopened dialog stays mounted.
    for (const call of exits) {
      expect(call.onDone).not.toHaveBeenCalled();
    }
    expect(screen.getByRole("dialog")).toBe(dialog);

    // The reopen also ran a fresh enter for the same element.
    expect(enterCalls().filter((call) => call.kind === "pop")).toHaveLength(2);
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

    render(ModalHarness);
    await fireEvent.click(screen.getByRole("button", { name: "Open modal" }));
    await tick();

    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await tick();
    await tick();

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
