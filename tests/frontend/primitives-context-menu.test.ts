// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import ContextMenuHarness from "./helpers/ContextMenuHarness.svelte";

describe("ContextMenu", () => {
  it("opens the menu on contextmenu with menuitem items", async () => {
    render(ContextMenuHarness);
    await fireEvent.contextMenu(screen.getByRole("button", { name: "Trigger" }));

    const menu = screen.getByRole("menu");
    expect(menu).not.toBeNull();
    expect(screen.getAllByRole("menuitem").length).toBeGreaterThan(0);
  });

  it("renders separators and disabled items with the right ARIA", async () => {
    render(ContextMenuHarness);
    await fireEvent.contextMenu(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByRole("separator")).not.toBeNull();
    const items = screen.getAllByRole("menuitem");
    const disabled = items.find((el) => el.textContent?.trim() === "Three");
    expect(disabled).toBeDefined();
    expect(disabled?.getAttribute("aria-disabled")).toBe("true");
    expect(disabled?.hasAttribute("disabled")).toBe(true);
  });

  it("moves focus to the first item on open and navigates with ArrowDown", async () => {
    render(ContextMenuHarness);
    await fireEvent.contextMenu(screen.getByRole("button", { name: "Trigger" }));

    const menu = screen.getByRole("menu");
    const items = screen.getAllByRole("menuitem");
    expect(document.activeElement).toBe(items[0]);

    await fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);
  });

  it("activates the focused item with Enter and calls onSelect", async () => {
    const onSelect = vi.fn();
    render(ContextMenuHarness, { onSelect });
    await fireEvent.contextMenu(screen.getByRole("button", { name: "Trigger" }));

    const menu = screen.getByRole("menu");
    await fireEvent.keyDown(menu, { key: "ArrowDown" });
    await fireEvent.keyDown(menu, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("two");
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    render(ContextMenuHarness);
    const trigger = screen.getByRole("button", { name: "Trigger" });
    await fireEvent.contextMenu(trigger);

    const menu = screen.getByRole("menu");
    await fireEvent.keyDown(menu, { key: "Escape" });

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger.parentElement);
  });

  it("closes on a second contextmenu and on outside pointerdown", async () => {
    render(ContextMenuHarness);
    const trigger = screen.getByRole("button", { name: "Trigger" });

    await fireEvent.contextMenu(trigger);
    expect(screen.getByRole("menu")).not.toBeNull();
    await fireEvent.contextMenu(trigger);
    expect(screen.queryByRole("menu")).toBeNull();

    await fireEvent.contextMenu(trigger);
    expect(screen.getByRole("menu")).not.toBeNull();
    await fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
