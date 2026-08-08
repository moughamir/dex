<script lang="ts">
  import { clsx } from "clsx";

  /** Hairline separator. Horizontal by default; vertical needs a sized parent. */

  let {
    orientation = "horizontal",
    class: className,
  }: {
    orientation?: "horizontal" | "vertical";
    class?: string;
  } = $props();
</script>

<hr
  aria-orientation={orientation}
  class={clsx("dex-divider", `dex-divider--${orientation}`, className)}
/>

<style>
  .dex-divider {
    border: none;
    background: var(--dex-border-subtle);
  }

  .dex-divider--horizontal {
    width: 100%;
    height: 1px;
  }

  .dex-divider--vertical {
    width: 1px;
    height: 100%;
  }
</style>
