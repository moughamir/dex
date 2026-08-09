<script lang="ts">
  import { themeStore } from "$lib/core/stores/theme.svelte";
  import {
    createRenderer,
    type GraphicsRenderer,
  } from "$lib/graphics/renderer";

  // Created by the `use:mountBackdrop` action. `$state` so the palette-push
  // effect reacts to its creation (initial push) and to later theme changes
  // (ADR-0003).
  let renderer: GraphicsRenderer | null = $state(null);

  // Theme changes are pushed to the renderer, never polled (ADR-0003). The
  // effect applies the initial palette once `renderer` is created and
  // re-applies whenever `themeStore.current` changes (read via the palette
  // getter for tracking).
  $effect(() => {
    if (renderer) {
      renderer.applyPalette(themeStore.palette);
    }
  });

  // Svelte action integrating the renderer's externally-owned canvas (owned
  // by graphics/, not Svelte) into the backdrop container. Runs on mount and
  // returns the teardown Svelte invokes on destroy.
  function mountBackdrop(node: HTMLDivElement): { destroy(): void } {
    const created = createRenderer();
    const canvas = created.surface.canvas;

    // Under the DOM chrome (ADR-0004): fills the window, stays transparent,
    // never intercepts pointer events. No z-index of its own — the -z-50
    // container keeps it below the chrome.
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.pointerEvents = "none";

    node.appendChild(canvas);

    // The backing store is sized in device pixels (DPR-aware) and follows
    // window resizes.
    const resize = (): void => {
      created.surface.resize(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio,
      );
    };
    resize();
    window.addEventListener("resize", resize);

    // DPR changes do not fire a `resize` event, so track the current scale
    // through a resolution media query. Best effort — guarded for headless
    // environments without matchMedia.
    let dprQuery: MediaQueryList | null = null;
    if (typeof window.matchMedia === "function") {
      dprQuery = window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`,
      );
      dprQuery.addEventListener?.("change", resize);
    }

    // Lazy start: the shell mount is the first visual need.
    const stop = created.start();

    // Publish the renderer so the effect above applies the initial palette.
    renderer = created;

    return {
      destroy() {
        window.removeEventListener("resize", resize);
        dprQuery?.removeEventListener?.("change", resize);
        stop();
        created.dispose();
      },
    };
  }
</script>

<div
  use:mountBackdrop
  class="pointer-events-none absolute inset-0 -z-50 overflow-hidden"
  aria-hidden="true"
></div>
