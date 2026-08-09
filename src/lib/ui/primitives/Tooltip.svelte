<script lang="ts">
  import { clsx } from "clsx";
  import type { Snippet } from "svelte";

  /**
   * Pure-CSS tooltip — no floating-ui. Wraps a trigger element; the tip
   * appears on `:hover` and `:focus-within` (keyboard users get it for free).
   * Shows after a short delay, hides fast. Reduced-motion is covered by the
   * global CSS net (app.css) — no local override.
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
    /* motion rule: transform/opacity only; visibility is a hard show/hide.
       Base state = exit path: fast hide (--motion-exit-*) */
    transition:
      opacity var(--motion-exit-duration) var(--motion-exit-ease),
      transform var(--motion-exit-duration) var(--motion-exit-ease),
      visibility 0s linear var(--motion-exit-duration);
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
    /* delayed fade-in so stray hovers don't flash the tip; enter path uses
       the --motion-enter-* vocabulary with a fast delay */
    transition:
      opacity var(--motion-enter-duration) var(--motion-enter-ease)
        var(--duration-fast),
      transform var(--motion-enter-duration) var(--motion-enter-ease)
        var(--duration-fast),
      visibility 0s;
  }

  .dex-tooltip:hover .dex-tooltip__tip[data-side="left"],
  .dex-tooltip:focus-within .dex-tooltip__tip[data-side="left"],
  .dex-tooltip:hover .dex-tooltip__tip[data-side="right"],
  .dex-tooltip:focus-within .dex-tooltip__tip[data-side="right"] {
    transform: translate(0, -50%) scale(1);
  }
</style>
