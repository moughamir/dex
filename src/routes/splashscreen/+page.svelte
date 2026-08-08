<script lang="ts">
  import { onMount } from "svelte";
  import { Shield, Sparkles } from "lucide-svelte";
  import { GlassPanel } from "$lib/ui/primitives";
  import { invoke } from "$lib/core/api/tauri";
  import { COMMANDS } from "$lib/core/api/commands";

  let statusText = $state("Initializing DEX core...");

  onMount(async () => {
    try {
      // Simulate frontend initialization tasks (loading config, themes, caches)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      statusText = "Loading system services...";
      await new Promise((resolve) => setTimeout(resolve, 1000));
      statusText = "Ready!";

      await invoke(COMMANDS.setComplete, { task: "frontend" });
    } catch (err) {
      console.error("Failed to complete frontend initialization:", err);
      statusText = "Initialization error";
    }
  });
</script>

<div
  class="flex h-screen w-screen items-center justify-center bg-transparent p-4"
>
  <GlassPanel
    class="flex w-full max-w-md flex-col items-center justify-center p-8 text-center shadow-2xl"
  >
    <div
      class="mb-4 flex items-center justify-center rounded-2xl bg-(--surface-3) p-4 ring-1 ring-(--dex-primary)/30"
    >
      <Shield class="size-10 text-(--dex-primary) animate-pulse" />
    </div>

    <h1 class="text-2xl font-bold tracking-tight text-(--text-primary)">
      OmniZya DEX
    </h1>
    <p class="mt-1 text-sm text-(--text-muted)">
      Programmable Desktop Layer for Hyprland
    </p>

    <div class="mt-6 flex w-full flex-col items-center gap-3">
      <div
        class="flex items-center gap-2 text-xs font-medium text-(--text-muted)"
      >
        <Sparkles class="size-4 animate-spin text-(--dex-primary)" />
        <span>{statusText}</span>
      </div>

      <div class="h-1.5 w-full overflow-hidden rounded-full bg-(--surface-3)">
        <div
          class="h-full w-full origin-left animate-pulse bg-(--dex-primary) transition-all duration-500"
        ></div>
      </div>
    </div>
  </GlassPanel>
</div>
