<script lang="ts">
  import { onMount } from "svelte";
  import { motionManager } from "$lib/ui/motion";

  onMount(() => {
    // Seed the glow to the viewport center until the first real pointermove.
    // The manager writes --cursor-x/--cursor-y and no-ops under reduced motion.
    motionManager.pointer.update(window.innerWidth / 2, window.innerHeight / 2);

    function update(event: PointerEvent) {
      motionManager.pointer.update(event.clientX, event.clientY);
    }

    window.addEventListener("pointermove", update, { passive: true });

    return () => {
      window.removeEventListener("pointermove", update);
    };
  });
</script>

<div class="dex-effect">
  <div class="dex-cursor-glow"></div>
</div>
