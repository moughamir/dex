<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";

  import { DOCK_WORKSPACES } from "$lib/core/config/navigation";
  import { shellStore } from "$lib/core/stores/shell.svelte";

  import { Button, GlassPanel, Tooltip } from "$lib/ui/primitives";

  const activeId = $derived(shellStore.activeWorkspace);

  function activate(href: string): void {
    void goto(resolve(href as Pathname));
  }
</script>

<div
  class="pointer-events-none absolute bottom-6 left-1/2 z-(--z-dock) -translate-x-1/2"
>
  <GlassPanel
    variant="dock"
    padding="sm"
    radius="full"
    class="pointer-events-auto flex items-center gap-2"
  >
    {#each DOCK_WORKSPACES as workspace (workspace.id)}
      <Tooltip label={workspace.label} side="top">
        <Button
          size="icon"
          variant="ghost"
          rounded="full"
          aria-label={workspace.label}
          aria-current={activeId === workspace.id ? "page" : undefined}
          class={activeId === workspace.id
            ? "bg-[color:var(--surface-3)] text-[color:var(--dex-primary)]"
            : ""}
          onclick={() => activate(workspace.href)}
        >
          <workspace.icon />
        </Button>
      </Tooltip>
    {/each}
  </GlassPanel>
</div>
