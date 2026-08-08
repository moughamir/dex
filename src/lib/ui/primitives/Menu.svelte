<script lang="ts">
  import { clsx } from "clsx";
  import {
    autoUpdate,
    computePosition,
    flip,
    offset,
    shift,
    type Placement,
  } from "@floating-ui/dom";
  import { Check } from "lucide-svelte";
  import type { Snippet } from "svelte";

  import { enabledItems, stepFocus, type MenuItem } from "./menu";

  interface Props {
    open: boolean;
    anchor: HTMLElement | null;
    items?: MenuItem[];
    onSelect?: (id: string) => void;
    onRequestClose?: () => void;
    placement?: Placement;
    radio?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    open,
    anchor,
    items = [],
    onSelect,
    onRequestClose,
    placement = "bottom-start",
    radio = false,
    class: className,
    children,
  }: Props = $props();

  let surfaceEl = $state<HTMLElement | null>(null);

  /** Portal the menu surface onto document.body (ADR-0007 D2). */
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  /** Collision-aware positioning via floating-ui (ADR-0007 D1). */
  $effect(() => {
    if (!open || !anchor || !surfaceEl) return;
    const surface = surfaceEl;

    const cleanup = autoUpdate(anchor, surface, () => {
      void computePosition(anchor, surface, {
        placement,
        strategy: "fixed",
        middleware: [offset(8), flip(), shift()],
      }).then(({ x, y }) => {
        surface.style.left = `${x}px`;
        surface.style.top = `${y}px`;
      });
    });

    return cleanup;
  });

  /** Move focus to the first enabled item when the menu opens. */
  $effect(() => {
    if (!open || !surfaceEl) return;
    enabledItems(surfaceEl)[0]?.focus();
  });

  /** Dismiss on pointerdown outside both the menu and its trigger. */
  $effect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (
        surfaceEl &&
        !surfaceEl.contains(target) &&
        (!anchor || !anchor.contains(target))
      ) {
        onRequestClose?.();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  });

  function activate(id: string) {
    onSelect?.(id);
    onRequestClose?.();
  }

  function onKeydown(e: KeyboardEvent) {
    if (!surfaceEl) return;
    const surface = surfaceEl;

    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        const list = enabledItems(surface);
        const current = list.indexOf(document.activeElement as HTMLElement);
        stepFocus(list, current, e.key === "ArrowDown" ? 1 : -1);
        break;
      }
      case "Home": {
        e.preventDefault();
        enabledItems(surface)[0]?.focus();
        break;
      }
      case "End": {
        e.preventDefault();
        const list = enabledItems(surface);
        list[list.length - 1]?.focus();
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        const active = document.activeElement as HTMLElement | null;
        const id = active?.getAttribute("data-menu-item-id");
        if (id) activate(id);
        break;
      }
      case "Escape":
      case "Tab": {
        e.preventDefault();
        onRequestClose?.();
        break;
      }
    }
  }
</script>

{#if open}
  <div
    bind:this={surfaceEl}
    use:portal
    role="menu"
    tabindex="-1"
    class={clsx("dex-menu min-w-40", className)}
    onkeydown={onKeydown}
  >
    {#each items as item (item.id)}
      {#if item.separator}
        <div role="separator" class="dex-menu__separator"></div>
      {:else}
        <button
          type="button"
          role={item.checked
            ? radio
              ? "menuitemradio"
              : "menuitemcheckbox"
            : "menuitem"}
          class="dex-menu__item text-sm"
          data-menu-item-id={item.id}
          aria-checked={item.checked ? "true" : undefined}
          aria-disabled={item.disabled ? "true" : undefined}
          disabled={item.disabled}
          tabindex="-1"
          onclick={() => activate(item.id)}
        >
          {#if item.icon}
            {@const Icon = item.icon}
            <Icon class="dex-menu__icon" aria-hidden="true" />
          {/if}
          {#if item.label}
            <span class="dex-menu__label">{item.label}</span>
          {/if}
          {#if item.checked}
            <Check class="dex-menu__check" aria-hidden="true" />
          {/if}
        </button>
      {/if}
    {/each}

    {@render children?.()}
  </div>
{/if}

<style>
  .dex-menu {
    position: fixed;
    z-index: var(--z-menu);
    padding: var(--space-2);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    background: var(--surface-2);
    box-shadow:
      var(--shadow-lg),
      inset 0 1px 0 var(--glass-border-light);
    backdrop-filter: blur(var(--blur-lg));
    -webkit-backdrop-filter: blur(var(--blur-lg));
    outline: none;
    animation: dex-menu-in var(--duration-fast) var(--ease-standard);
  }

  @keyframes dex-menu-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dex-menu__item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    font: inherit;
    text-align: left;
    cursor: pointer;
    outline: none;
  }

  .dex-menu__item:hover:not(:disabled) {
    background: var(--surface-3);
  }

  .dex-menu__item:focus-visible {
    box-shadow: var(--focus-ring);
  }

  .dex-menu__item:disabled {
    color: var(--text-disabled);
    cursor: default;
  }

  .dex-menu__separator {
    height: 1px;
    margin: var(--space-1) var(--space-2);
    background: var(--border-subtle);
  }

  .dex-menu__icon {
    flex-shrink: 0;
  }

  .dex-menu__check {
    flex-shrink: 0;
    margin-left: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .dex-menu {
      animation: none;
    }
  }
</style>
