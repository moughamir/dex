<script lang="ts">
  import type { Snippet } from "svelte";

  import { shellStore } from "$lib/core/stores/shell.svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  const dockVisible = $derived(shellStore.dockVisible);
</script>

<main
  class="relative flex-1 overflow-y-auto p-8 {dockVisible
    ? 'pb-[calc(var(--status-height)+var(--dock-height)+var(--space-6))]'
    : 'pb-[calc(var(--status-height)+var(--space-6))]'}"
>
  <div class="mx-auto w-full max-w-(--content-max-width)">
    {@render children?.()}
  </div>
</main>
