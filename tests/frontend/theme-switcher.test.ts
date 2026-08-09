// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { themeStore } from "$lib/core/stores/theme.svelte";
import ThemeSwitcher from "$lib/ui/layout/ThemeSwitcher.svelte";

const transitionTheme = vi.hoisted(() => vi.fn());
const transitionManager = vi.hoisted(() => ({
  enter: vi.fn(),
  exit: vi.fn(),
}));

vi.mock("$lib/ui/motion", () => ({ transitionTheme, transitionManager }));

/**
 * The Dropdown renders a Menu whose surface stays mounted while its exit
 * animation runs (M2.3 phase state machine). The motion layer is mocked with
 * already-finished handles, so two ticks flush the exit's onDone → "closed" →
 * unmount.
 */
async function settle() {
  await tick();
  await tick();
}

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    themeStore.apply("dark");
    transitionTheme.mockReset();
    transitionManager.enter.mockReset();
    transitionManager.exit.mockReset();
    transitionManager.enter.mockImplementation(() => ({
      cancel: vi.fn(),
      finish: vi.fn(),
      finished: Promise.resolve(),
    }));
    transitionManager.exit.mockImplementation(
      (opts: { onDone?: () => void }) => {
        const handle = {
          cancel: vi.fn(),
          finish: vi.fn(),
          finished: Promise.resolve(),
        };
        handle.finished.then(
          () => opts.onDone?.(),
          () => {},
        );
        return handle;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a trigger button for the current theme with aria-haspopup", () => {
    render(ThemeSwitcher);
    const trigger = screen.getByRole("button", { name: "Dark" });

    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("opens a menu listing Dark, Cyber, Light in config order", async () => {
    render(ThemeSwitcher);
    await fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    await settle();

    expect(screen.getByRole("menu")).not.toBeNull();

    const items = [
      screen.getByRole("menuitemradio"),
      ...screen.getAllByRole("menuitem"),
    ];
    expect(items.map((el) => el.textContent?.trim())).toEqual([
      "Dark",
      "Cyber",
      "Light",
    ]);
  });

  it("selecting Light routes through transitionTheme, not the store directly", async () => {
    const apply = vi.spyOn(themeStore, "apply");
    render(ThemeSwitcher);
    await fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    await settle();
    await fireEvent.click(screen.getByText("Light"));
    await settle();

    expect(transitionTheme).toHaveBeenCalledTimes(1);
    expect(transitionTheme).toHaveBeenCalledWith("light");
    expect(apply).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("marks the selected theme as a checked menuitemradio", async () => {
    themeStore.apply("cyber");
    render(ThemeSwitcher);
    await fireEvent.click(screen.getByRole("button", { name: "Cyber" }));
    await settle();

    const radio = screen.getByRole("menuitemradio");
    expect(radio.getAttribute("aria-checked")).toBe("true");
    expect(radio.textContent).toContain("Cyber");
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    render(ThemeSwitcher);
    const trigger = screen.getByRole("button", { name: "Dark" });

    await fireEvent.click(trigger);
    await settle();
    await fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await settle();

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
