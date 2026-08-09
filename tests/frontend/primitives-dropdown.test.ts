// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, it, vi } from "vitest";

import Dropdown from "$lib/ui/primitives/Dropdown.svelte";

const ITEMS = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
];

/**
 * The Menu surface stays mounted while its exit animation runs (M2.3 phase
 * state machine). In jsdom the real web driver finishes immediately, so two
 * ticks flush the exit's onDone → "closed" → unmount.
 */
async function settle() {
  await tick();
  await tick();
}

describe("Dropdown", () => {
  it("opens on click and closes on outside pointerdown", async () => {
    render(Dropdown, { label: "Theme", items: ITEMS });
    const trigger = screen.getByRole("button", { name: "Theme" });

    expect(screen.queryByRole("menu")).toBeNull();
    await fireEvent.click(trigger);
    await settle();
    expect(screen.getByRole("menu")).not.toBeNull();

    await fireEvent.pointerDown(document.body);
    await settle();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("calls onSelect and closes when an item is chosen", async () => {
    const onSelect = vi.fn();
    render(Dropdown, { label: "Theme", items: ITEMS, onSelect });

    await fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    await settle();
    await fireEvent.click(screen.getByText("Dark"));
    await settle();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("dark");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("marks the selected item as menuitemradio with aria-checked", async () => {
    render(Dropdown, { label: "Theme", items: ITEMS, selected: "light" });

    await fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    await settle();
    const radio = screen.getByRole("menuitemradio");
    expect(radio.getAttribute("aria-checked")).toBe("true");
    expect(radio.textContent).toContain("Light");
  });

  it("navigates with ArrowDown and selects with Enter", async () => {
    const onSelect = vi.fn();
    render(Dropdown, { label: "Theme", items: ITEMS, onSelect });

    await fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    await settle();
    const menu = screen.getByRole("menu");
    const items = screen.getAllByRole("menuitem");

    await fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);

    await fireEvent.keyDown(menu, { key: "Enter" });
    await settle();
    expect(onSelect).toHaveBeenCalledWith("light");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("ArrowDown on the trigger opens and moves to the first item", async () => {
    render(Dropdown, { label: "Theme", items: ITEMS });
    const trigger = screen.getByRole("button", { name: "Theme" });

    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await settle();

    const items = screen.getAllByRole("menuitem");
    expect(screen.getByRole("menu")).not.toBeNull();
    expect(document.activeElement).toBe(items[0]);
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    render(Dropdown, { label: "Theme", items: ITEMS });
    const trigger = screen.getByRole("button", { name: "Theme" });

    await fireEvent.click(trigger);
    await settle();
    await fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await settle();

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("syncs aria-haspopup and aria-expanded with the open state", async () => {
    render(Dropdown, { label: "Theme", items: ITEMS });
    const trigger = screen.getByRole("button", { name: "Theme" });

    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await fireEvent.click(trigger);
    await settle();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
