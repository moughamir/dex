<script lang="ts">
  import { page } from "$app/state";

  import { shellStore } from "$lib/core/stores/shell.svelte";

  import { GlassPanel } from "$lib/ui/primitives";
  import { NavItem, NavSection } from "$lib/ui/navigation";

  const currentPath = $derived(page.url.pathname);

  function isActive(href: string): boolean {
    return href === "/" ? currentPath === "/" : currentPath.startsWith(href);
  }
</script>

<aside
  class="z-(--z-sidebar) h-full p-6 {shellStore.sidebarCollapsed
    ? 'w-(--sidebar-collapsed-width)'
    : 'w-(--sidebar-width)'}"
>
  <GlassPanel variant="sidebar" padding="sm" class="flex h-full flex-col">
    <div class="space-y-6">
      {#each shellStore.currentContext as section (section.id)}
        <NavSection title={section.title}>
          {#each section.items as item (item.id)}
            <NavItem
              label={item.label}
              href={item.href}
              active={isActive(item.href)}
            >
              {#snippet badge()}
                {#if item.badge}
                  <span
                    class="rounded-full bg-(--surface-3) px-2 py-0.5 text-[10px]"
                  >
                    {item.badge}
                  </span>
                {/if}
              {/snippet}
            </NavItem>
          {/each}
        </NavSection>
      {/each}
    </div>

    <div class="flex-1"></div>
  </GlassPanel>
</aside>
