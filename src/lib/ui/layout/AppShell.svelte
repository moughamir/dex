<script lang="ts">
  import Background from "$lib/ui/effects/Background.svelte";
  import { shellStore } from "$lib/core/stores/shell.svelte";

  import TopBar from "./TopBar.svelte";
  import Sidebar from "./Sidebar.svelte";
  import Dock from "./Dock.svelte";
  import StatusBar from "./StatusBar.svelte";

  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  const sidebarVisible = $derived(shellStore.sidebarVisible);
  const dockVisible = $derived(shellStore.dockVisible);
</script>

<div
  class="relative h-screen w-screen overflow-hidden bg-transparent text-(--text-primary)"
  data-tauri-drag-region
>
  <Background />

  <TopBar />

  <div class="flex h-full pt-(--hud-height)">
    {#if sidebarVisible}
      <Sidebar />
    {/if}

    <main
      class="relative flex-1 overflow-auto p-8 {dockVisible
        ? 'pb-[calc(var(--status-height)+var(--dock-height)+var(--space-6))]'
        : 'pb-[calc(var(--status-height)+var(--space-6))]'}"
    >
      {@render children?.()}
    </main>
  </div>

  {#if dockVisible}
    <Dock />
  {/if}

  <StatusBar />
</div>
