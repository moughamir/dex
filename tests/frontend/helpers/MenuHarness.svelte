<script lang="ts">
  import Menu from "$lib/ui/primitives/Menu.svelte";
  import type { MenuItem } from "$lib/ui/primitives/menu";

  interface Props {
    items?: MenuItem[];
    onSelect?: (id: string) => void;
    onRequestClose?: () => void;
  }

  let { items = [], onSelect, onRequestClose }: Props = $props();

  let open = $state(false);
  let anchorEl = $state<HTMLElement | null>(null);

  function requestClose() {
    onRequestClose?.();
    open = false;
  }
</script>

<button
  type="button"
  bind:this={anchorEl}
  class="menu-trigger"
  onclick={() => (open = true)}
>
  Open menu
</button>

<Menu
  {open}
  anchor={anchorEl}
  {items}
  {onSelect}
  onRequestClose={requestClose}
/>
