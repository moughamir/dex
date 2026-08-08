<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title?: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<section class="space-y-2">
  {#if title}
    <h3
      class="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-(--text-muted)"
    >
      {title}
    </h3>
  {/if}

  <div class="space-y-1">
    {@render children?.()}
  </div>
</section>
