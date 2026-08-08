<script lang="ts">
  import { clsx } from "clsx";
  import type { Snippet } from "svelte";

  /**
   * Pure-CSS tooltip — no floating-ui. Wraps a trigger element; the tip
   * appears on `:hover` and `:focus-within` (keyboard users get it for free).
   * Shows with a short delay, hides instantly. Reduced-motion kills the
   * transition entirely.
   */

  let {
    label,
    side = "top",
    class: className,
    children,
  }: {
    label: string;
    side?: "top" | "bottom" | "left" | "right";
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<span class={clsx("dex-tooltip", className)}>
  {@render children?.()}

  <span class="dex-tooltip__tip" role="tooltip" data-side={side}>{label}</span>
</span>

<style>
  .dex-tooltip {
    position: relative;
    display: inline-flex;
  }

  .dex-tooltip__tip {
    position: absolute;
    z-index: var(--dex-z-tooltip);
    visibility: hidden;
    opacity: 0;
    padding: var(--dex-space-2) var(--dex-space-3);
    border-radius: var(--dex-radius-sm);
    border: 1px solid var(--dex-border-subtle);
    background: var(--dex-surface-2);
    color: var(--dex-text-1);
    font-size: var(--dex-font-size-xs);
    letter-spacing: var(--dex-tracking-wide);
    white-space: nowrap;
    pointer-events: none;
    /* motion rule: transform/opacity only; visibility is a hard show/hide */
    transition:
      opacity var(--dex-duration-base) var(--dex-ease-out),
      transform var(--dex-duration-base) var(--dex-ease-out),
      visibility 0s linear var(--dex-duration-base);
  }

  .dex-tooltip__tip[data-side="top"],
  .dex-tooltip__tip[data-side="bottom"] {
    left: 50%;
    transform: translate(-50%, 0) scale(0.96);
  }

  .dex-tooltip__tip[data-side="top"] {
    bottom: calc(100% + var(--dex-space-3));
    transform-origin: center bottom;
  }

  .dex-tooltip__tip[data-side="bottom"] {
    top: calc(100% + var(--dex-space-3));
    transform-origin: center top;
  }

  .dex-tooltip__tip[data-side="left"],
  .dex-tooltip__tip[data-side="right"] {
    top: 50%;
    transform: translate(0, -50%) scale(0.96);
  }

  .dex-tooltip__tip[data-side="left"] {
    right: calc(100% + var(--dex-space-3));
    transform-origin: right center;
  }

  .dex-tooltip__tip[data-side="right"] {
    left: calc(100% + var(--dex-space-3));
    transform-origin: left center;
  }

  .dex-tooltip:hover .dex-tooltip__tip,
  .dex-tooltip:focus-within .dex-tooltip__tip {
    visibility: visible;
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
    /* delayed fade-in so stray hovers don't flash the tip */
    transition:
      opacity var(--dex-duration-base) var(--dex-ease-out)
        var(--dex-duration-fast),
      transform var(--dex-duration-base) var(--dex-ease-out)
        var(--dex-duration-fast),
      visibility 0s;
  }

  .dex-tooltip:hover .dex-tooltip__tip[data-side="left"],
  .dex-tooltip:focus-within .dex-tooltip__tip[data-side="left"],
  .dex-tooltip:hover .dex-tooltip__tip[data-side="right"],
  .dex-tooltip:focus-within .dex-tooltip__tip[data-side="right"] {
    transform: translate(0, -50%) scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    .dex-tooltip__tip,
    .dex-tooltip:hover .dex-tooltip__tip,
    .dex-tooltip:focus-within .dex-tooltip__tip {
      transition: none;
    }
  }
</style>
