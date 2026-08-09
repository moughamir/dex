<script lang="ts">
  import { clsx } from "clsx";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  type CardElement = "div" | "section" | "article" | "aside";
  type CardVariant = "default" | "raised" | "floating";
  type CardPadding = "none" | "sm" | "md" | "lg";
  type CardRadius = "md" | "lg" | "xl";

  interface Props extends HTMLAttributes<HTMLElement> {
    element?: CardElement;
    variant?: CardVariant;
    padding?: CardPadding;
    radius?: CardRadius;
    interactive?: boolean;
    glow?: boolean;
    class?: string;
    contentClass?: string;
    header?: Snippet;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    element = "div",
    variant = "default",
    padding = "md",
    radius = "lg",
    interactive = false,
    glow = false,
    class: className,
    contentClass,
    header,
    children,
    footer,
    ...rest
  }: Props = $props();

  const classes = $derived(
    clsx(
      "dex-card",
      `dex-card--${variant}`,
      `dex-card--radius-${radius}`,
      {
        "dex-card--interactive": interactive,
        "dex-card--glow": glow,
      },
      className,
    ),
  );
</script>

<svelte:element this={element} class={classes} {...rest}>
  {#if header}
    <div class="dex-card__header">
      {@render header()}
    </div>
  {/if}

  <div class={clsx("dex-card__body", `dex-padding--${padding}`, contentClass)}>
    {@render children?.()}
  </div>

  {#if footer}
    <div class="dex-card__footer">
      {@render footer()}
    </div>
  {/if}
</svelte:element>

<style>
  .dex-card {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--glass-border);
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    transform: translateZ(0);
    box-shadow:
      var(--shadow-lg),
      inset 0 1px 0 var(--glass-border-light),
      inset 0 -1px 0 var(--border-subtle);
    /* hover lift/shadow adopt the spring motion vocabulary (ADR-0009) */
    transition:
      transform var(--motion-hover-duration) var(--motion-hover-ease),
      box-shadow var(--motion-hover-duration) var(--motion-hover-ease),
      border-color var(--motion-hover-duration) var(--motion-hover-ease);
  }

  .dex-card--radius-md {
    border-radius: var(--radius-md);
  }

  .dex-card--radius-lg {
    border-radius: var(--radius-lg);
  }

  .dex-card--radius-xl {
    border-radius: var(--radius-xl);
  }

  .dex-card--raised {
    box-shadow:
      var(--shadow-xl),
      inset 0 1px 0 var(--glass-border-light);
  }

  .dex-card--floating {
    backdrop-filter: blur(var(--blur-lg));
    -webkit-backdrop-filter: blur(var(--blur-lg));
  }

  .dex-card--interactive:hover {
    transform: translateY(-2px) translateZ(0);
    box-shadow:
      var(--shadow-xl),
      inset 0 1px 0 var(--glass-border-light);
  }

  .dex-card--glow {
    box-shadow:
      var(--shadow-accent),
      var(--shadow-lg),
      inset 0 1px 0 var(--glass-border-light);
  }

  .dex-card__header,
  .dex-card__footer {
    padding: var(--space-4);
  }

  .dex-card__header {
    border-bottom: 1px solid var(--border-subtle);
  }

  .dex-card__footer {
    border-top: 1px solid var(--border-subtle);
  }

  .dex-padding--none {
    padding: 0;
  }

  .dex-padding--sm {
    padding: var(--space-3);
  }

  .dex-padding--md {
    padding: var(--space-4);
  }

  .dex-padding--lg {
    padding: var(--space-6);
  }
</style>
