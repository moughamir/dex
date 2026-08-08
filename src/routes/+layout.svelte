<script lang="ts">
  import "../app.css";

  import { onMount } from "svelte";

  import { page } from "$app/state";

  import { HUD } from "$lib/ui/layout";
  import { themeStore } from "$lib/core/stores/theme.svelte";
  import { shellStore } from "$lib/core/stores/shell.svelte";
  import { windowStore } from "$lib/core/stores/window.svelte";

  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  // The splashscreen is a zero-capability standalone window (ADR-0006): it must
  // render only its own page, never the desktop shell chrome.
  const isSplash = $derived(page.url.pathname.startsWith("/splashscreen"));

  onMount(() => {
    themeStore.init();
    shellStore.init();
    // windowStore.init() reads main-window-only APIs (scale factor, inner
    // size, current monitor) that are ACL-denied on the zero-capability splash
    // window (ADR-0006). Keep least-privilege capabilities — do not grant the
    // splash window more; just skip the main-window API init there.
    if (!isSplash) {
      windowStore.init();
    }
  });
</script>

{#if isSplash}
  {@render children?.()}
{:else}
  <HUD>
    {@render children?.()}
  </HUD>
{/if}
