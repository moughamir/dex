import type { Component } from "svelte";

/**
 * A single menu entry shared by ContextMenu and Dropdown.
 *
 * `separator` renders a divider instead of an item; the rest of the
 * fields are ignored for separators.
 */
export interface MenuItem {
  id: string;
  label?: string;
  icon?: Component;
  disabled?: boolean;
  separator?: boolean;
  checked?: boolean;
}

/**
 * All menu item elements inside a menu surface, in DOM order. Matches the
 * `role` values the internal `Menu.svelte` surface renders.
 */
export function menuItems(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  );
}

/**
 * Enabled (non-disabled) items — the only ones roving focus visits.
 */
export function enabledItems(root: HTMLElement): HTMLElement[] {
  return menuItems(root).filter(
    (el) =>
      !(el as HTMLButtonElement).disabled &&
      el.getAttribute("aria-disabled") !== "true",
  );
}

/**
 * Focus the item at `index` computed from `current`, wrapping at both ends
 * (ArrowUp/ArrowDown). `current === -1` means nothing is focused yet, so the
 * first/last item is chosen depending on direction.
 */
export function stepFocus(
  items: HTMLElement[],
  current: number,
  direction: 1 | -1,
): void {
  if (items.length === 0) return;
  const next =
    current === -1
      ? direction === 1
        ? 0
        : items.length - 1
      : (current + direction + items.length) % items.length;
  items[next]?.focus();
}
