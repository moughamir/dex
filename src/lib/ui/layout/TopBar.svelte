<script lang="ts">
  import {
    Bell,
    PanelLeftClose,
    PanelLeftOpen,
    Settings2,
    Search,
  } from "lucide-svelte";

  import { shellStore } from "$lib/core/stores/shell.svelte";
  import { workspaceLabel } from "$lib/core/utils/helpers";

  import { Button, GlassPanel, Tooltip } from "$lib/ui/primitives";
  import { SearchBox } from "$lib/ui/navigation";
  import ThemeSwitcher from "./ThemeSwitcher.svelte";

  const label = $derived(workspaceLabel(shellStore.activeWorkspace));

  let query = $state("");
  let searchOpen = $state(false);
</script>

<header
  class="absolute inset-x-0 top-0 z-(--z-hud) flex h-(--hud-height) items-center px-6 py-1.5"
  data-tauri-drag-region
>
  <GlassPanel variant="hud" padding="sm" class="h-full w-full px-3">
    <div class="flex items-center gap-2.5" data-tauri-drag-region>
      <div
        class="flex size-8 items-center justify-center rounded-lg bg-(--dex-primary) text-xs font-bold text-[color:var(--on-primary)]"
      >
        D
      </div>

      <div class="leading-tight" data-tauri-drag-region>
        <h1 class="text-xs font-semibold">DEX</h1>

        <p class="text-[11px] text-(--text-muted)">
          {label}
        </p>
      </div>
    </div>

    <div class="flex-1"></div>

    <div class="flex items-center gap-1.5">
      <Tooltip label="Toggle sidebar">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle sidebar"
          aria-pressed={shellStore.sidebarCollapsed}
          onclick={() => shellStore.toggleSidebar()}
        >
          {#if shellStore.sidebarCollapsed}
            <PanelLeftOpen class="size-4" />
          {:else}
            <PanelLeftClose class="size-4" />
          {/if}
        </Button>
      </Tooltip>

      <ThemeSwitcher />

      {#if searchOpen}
        <div class="w-64 max-w-md">
          <SearchBox bind:value={query} />
        </div>
      {/if}

      <Tooltip label="Search">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          aria-expanded={searchOpen}
          onclick={() => (searchOpen = !searchOpen)}
        >
          <Search class="size-4" />
        </Button>
      </Tooltip>

      <Tooltip label="Notifications">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell class="size-4" />
        </Button>
      </Tooltip>

      <Tooltip label="Settings">
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings2 class="size-4" />
        </Button>
      </Tooltip>
    </div>
  </GlassPanel>
</header>
