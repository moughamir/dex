// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import Modal from "$lib/ui/primitives/Modal.svelte";
import ModalHarness from "./helpers/ModalHarness.svelte";

describe("Modal", () => {
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

    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("restores focus to the trigger when it closes", async () => {
    render(ModalHarness);
    const trigger = screen.getByRole("button", { name: "Open modal" });
    trigger.focus();

    await fireEvent.click(trigger);
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
