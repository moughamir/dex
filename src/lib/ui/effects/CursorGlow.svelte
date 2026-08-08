<script lang="ts">
  import { onMount } from "svelte";

  onMount(() => {
    let ticking = false;
    let lastX = window.innerWidth / 2;
    let lastY = window.innerHeight / 2;

    document.documentElement.style.setProperty("--cursor-x", `${lastX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${lastY}px`);

    function update(event: PointerEvent) {
      lastX = event.clientX;
      lastY = event.clientY;

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty(
            "--cursor-x",
            `${lastX}px`,
          );
          document.documentElement.style.setProperty(
            "--cursor-y",
            `${lastY}px`,
          );
          ticking = false;
        });
      }
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
