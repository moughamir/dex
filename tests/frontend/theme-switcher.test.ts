// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";

import { themeStore } from "$lib/core/stores/theme.svelte";
import ThemeSwitcher from "$lib/ui/layout/ThemeSwitcher.svelte";

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    themeStore.apply("dark");
  });

  it("renders a trigger button for the current theme with aria-haspopup", () => {
    render(ThemeSwitcher);
    const trigger = screen.getByRole("button", { name: "Dark" });

    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("opens a menu listing Dark, Cyber, Light in config order", async () => {
    render(ThemeSwitcher);
    await fireEvent.click(screen.getByRole("button", { name: "Dark" }));

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

  it("selecting Light applies the theme end to end and closes", async () => {
    render(ThemeSwitcher);
    await fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    await fireEvent.click(screen.getByText("Light"));

    expect(themeStore.current).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("marks the selected theme as a checked menuitemradio", async () => {
    themeStore.apply("cyber");
    render(ThemeSwitcher);
    await fireEvent.click(screen.getByRole("button", { name: "Cyber" }));

    const radio = screen.getByRole("menuitemradio");
    expect(radio.getAttribute("aria-checked")).toBe("true");
    expect(radio.textContent).toContain("Cyber");
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    render(ThemeSwitcher);
    const trigger = screen.getByRole("button", { name: "Dark" });

    await fireEvent.click(trigger);
    await fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
