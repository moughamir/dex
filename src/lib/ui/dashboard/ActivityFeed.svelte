<script lang="ts">
  import { Activity } from "lucide-svelte";

  import Widget from "./Widget.svelte";

  const items = [
    "DEX initialized.",
    "Theme loaded.",
    "Database connected.",
    "Plugin manager ready.",
  ];
</script>

<Widget title="Activity" subtitle="Recent events" icon={Activity}>
  <div class="space-y-3">
    {#each items as item (item)}
      <div class="rounded-xl bg-(--surface-2) p-4">
        {item}
      </div>
    {/each}
  </div>
</Widget>
