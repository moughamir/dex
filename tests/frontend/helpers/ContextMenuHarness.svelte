<script lang="ts">
  import ContextMenu from "$lib/ui/primitives/ContextMenu.svelte";
  import type { MenuItem } from "$lib/ui/primitives/menu";

  interface Props {
    items?: MenuItem[];
    onSelect?: (id: string) => void;
    triggerLabel?: string;
  }

  let {
    items = [
      { id: "one", label: "One" },
      { id: "two", label: "Two" },
      { id: "sep", separator: true },
      { id: "three", label: "Three", disabled: true },
    ],
    onSelect,
    triggerLabel = "Trigger",
  }: Props = $props();
</script>

<ContextMenu {items} {onSelect}>
  {#snippet trigger()}
    <button type="button" class="context-trigger">{triggerLabel}</button>
  {/snippet}
</ContextMenu>
