<script lang="ts">
  import { Badge, GlassPanel } from "$lib/ui/primitives";

  interface Props {
    title: string;
    description: string;
    /**
     * Lucide icon component. Typed as a lucide icon (not Svelte 5's
     * function-component `Component`) because lucide-svelte v1.0.1 exports
     * class components — all icons share the same constructor type, so any
     * icon is assignable here.
     */
    icon?: typeof import("lucide-svelte").House;
    category?: string;
  }

  let {
    title,
    description,
    icon: Icon,
    category = "Workspace",
  }: Props = $props();
</script>

<div class="flex flex-col gap-6">
  <header class="flex items-center justify-between">
    <div>
      <div class="mb-2 flex items-center gap-2">
        <Badge variant="outline">{category}</Badge>
        <span class="text-xs text-(--text-muted)">Phase 0 Shell</span>
      </div>

      <h1 class="text-3xl font-bold">{title}</h1>

      <p class="mt-1 text-sm text-(--text-muted)">{description}</p>
    </div>
  </header>

  <GlassPanel
    class="flex min-h-96 flex-col items-center justify-center gap-4 text-center p-12"
  >
    {#if Icon}
      <div class="rounded-2xl bg-(--surface-3) p-5 text-(--dex-primary)">
        <Icon class="size-10" />
      </div>
    {/if}

    <div class="max-w-md space-y-2">
      <h2 class="text-xl font-semibold">{title} Workspace</h2>

      <p class="text-sm text-(--text-muted)">
        This view is active in the DEX navigation layer. Wire backend services
        in Phase 1 to activate live data.
      </p>
    </div>
  </GlassPanel>
</div>
