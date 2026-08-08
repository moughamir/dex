<script lang="ts">
  import type { Placement } from "@floating-ui/dom";
  import type { Snippet } from "svelte";

  import Button from "./Button.svelte";
  import Menu from "./Menu.svelte";
  import type { MenuItem } from "./menu";

  interface Props {
    label?: string;
    trigger?: Snippet;
    items?: MenuItem[];
    selected?: string;
    onSelect?: (id: string) => void;
    placement?: Placement;
    class?: string;
    children?: Snippet;
  }

  let {
    label,
    trigger,
    items = [],
    selected,
    onSelect,
    placement = "bottom-start",
    class: className,
    children,
  }: Props = $props();

  let open = $state(false);
  let triggerEl = $state<HTMLElement | null>(null);

  const menuItems = $derived(
    items.map((item) => ({
      ...item,
      checked: item.checked ?? item.id === selected,
    })),
  );

  function toggle() {
    open = !open;
  }

  function focusTrigger() {
    const el = triggerEl?.firstElementChild;
    if (el instanceof HTMLElement) el.focus();
  }

  function requestClose() {
    open = false;
    focusTrigger();
  }

  function handleTriggerKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open = true;
    }
  }

  /**
   * Wire the ARIA contract and interactions onto the trigger's real
   * interactive element (the snippet root, or the built-in Button). The
   * effect re-runs on every open change to keep aria-expanded in sync.
   */
  $effect(() => {
    const target = triggerEl?.firstElementChild;
    if (!(target instanceof HTMLElement)) return;

    target.setAttribute("aria-haspopup", "menu");
    target.setAttribute("aria-expanded", String(open));

    function onClick() {
      toggle();
    }

    function onKeydown(e: KeyboardEvent) {
      handleTriggerKeydown(e);
    }

    target.addEventListener("click", onClick);
    target.addEventListener("keydown", onKeydown);

    return () => {
      target.removeEventListener("click", onClick);
      target.removeEventListener("keydown", onKeydown);
    };
  });
</script>

<span bind:this={triggerEl} class="dex-dropdown">
  {#if trigger}
    {@render trigger()}
  {:else}
    <Button variant="secondary">{label}</Button>
  {/if}
</span>

<Menu
  {open}
  anchor={triggerEl}
  items={menuItems}
  {onSelect}
  onRequestClose={requestClose}
  {placement}
  radio
  class={className}
>
  {@render children?.()}
</Menu>
