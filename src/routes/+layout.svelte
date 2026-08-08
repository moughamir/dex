<script lang="ts">
  import "../app.css";

  import { onMount } from "svelte";

  import { HUD } from "$lib/ui/layout";
  import { themeStore } from "$lib/core/stores/theme.svelte";
  import { shellStore } from "$lib/core/stores/shell.svelte";

  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  onMount(() => {
    themeStore.init();
    shellStore.init();
  });
</script>

<HUD>
  {@render children?.()}
</HUD>
