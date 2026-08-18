<script lang="ts">
  import { shellStore } from "$lib/core/stores/shell.svelte";
  import { workspaceLabel } from "$lib/core/utils/helpers";

  const now = $state(new Date());

  $effect(() => {
    const timer = setInterval(() => {
      now.setTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  });

  const time = $derived(
    now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  const label = $derived(workspaceLabel(shellStore.activeWorkspace));
</script>

<footer
  class="absolute bottom-0 left-0 right-0 z-(--z-status) flex h-(--status-height) items-center justify-between px-6 text-xs text-(--text-muted)"
>
  <div>DEX v0.1.0 · {label}</div>

  <div>{time}</div>
</footer>
