<script lang="ts">
  import type { Placement } from "@floating-ui/dom";
  import type { Snippet } from "svelte";

  import Menu from "./Menu.svelte";
  import type { MenuItem } from "./menu";

  interface Props {
    trigger: Snippet;
    items?: MenuItem[];
    onSelect?: (id: string) => void;
    placement?: Placement;
    class?: string;
    children?: Snippet;
  }

  let {
    trigger,
    items = [],
    onSelect,
    placement = "bottom-start",
    class: className,
    children,
  }: Props = $props();

  let open = $state(false);
  let wrapperEl = $state<HTMLElement | null>(null);

  function requestClose() {
    open = false;
    wrapperEl?.focus();
  }

  /** Attach contextmenu + Shift+F10 to the wrapper. Listeners are added in
   *  an effect (not template attributes) to keep the static span a11y-clean:
   *  the span is a container, not an interactive control. */
  $effect(() => {
    const el = wrapperEl;
    if (!el) return;
    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
      open = !open;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "F10" && e.shiftKey) {
        e.preventDefault();
        open = !open;
      }
    }
    el.addEventListener("contextmenu", onContextMenu);
    el.addEventListener("keydown", onKeyDown);
    return () => {
      el.removeEventListener("contextmenu", onContextMenu);
      el.removeEventListener("keydown", onKeyDown);
    };
  });
</script>

<span bind:this={wrapperEl} class="dex-context-menu" tabindex="-1">
  {@render trigger()}
</span>

<Menu
  {open}
  anchor={wrapperEl}
  {items}
  {onSelect}
  onRequestClose={requestClose}
  {placement}
  class={className}
>
  {@render children?.()}
</Menu>

<style>
  .dex-context-menu {
    position: relative;
    display: inline-block;
    outline: none;
  }
</style>
