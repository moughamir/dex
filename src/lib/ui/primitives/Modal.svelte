<script module lang="ts">
  let modalSeq = 0;
  function nextModalSeq() {
    modalSeq += 1;
    return modalSeq;
  }
</script>

<script lang="ts">
  import { clsx } from "clsx";
  import { X } from "lucide-svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  import { transitionManager } from "$lib/ui/motion";

  type ModalBase = Omit<
    HTMLAttributes<HTMLDivElement>,
    "onclose" | "title" | "open" | "aria-labelledby"
  >;

  interface Props extends ModalBase {
    open: boolean;
    onclose?: () => void;
    title?: string;
    description?: string;
    portalTarget?: HTMLElement;
    class?: string;
    header?: Snippet;
    children?: Snippet;
    footer?: Snippet;
    "aria-labelledby"?: string;
  }

  let {
    open,
    onclose,
    title,
    description,
    portalTarget,
    class: className,
    header,
    children,
    footer,
    "aria-labelledby": ariaLabelledby,
    ...rest
  }: Props = $props();

  // Stable ARIA ids. A Modal without `title` and without an explicit
  // `aria-labelledby` is a contract violation (DesignSystem.md) — unlabeled.
  const instanceSeq = nextModalSeq();
  // A custom `header` snippet replaces the built-in title + close button,
  // so the id is only derived when the built-in header actually renders.
  const titleId = $derived(
    title && !header ? `dex-modal-title-${instanceSeq}` : undefined,
  );
  const descriptionId = $derived(
    description ? `dex-modal-desc-${instanceSeq}` : undefined,
  );

  let surfaceEl = $state<HTMLElement | null>(null);
  let backdropEl = $state<HTMLElement | null>(null);

  /**
   * Mount/unmount phase (ADR-0009 phase state machine). The backdrop + surface
   * stay MOUNTED while `phase === "closing"` so the exit animation can run;
   * both exits' `onDone` flip to `"closed"` and unmount.
   */
  type ModalPhase = "open" | "closing" | "closed";
  let phase = $state<ModalPhase>("closed");

  /** Drive the phase machine from the `open` prop. */
  $effect(() => {
    if (open) {
      phase = "open";
    } else if (phase !== "closed") {
      phase = "closing";
    }
  });

  /** Enter: pop the surface, fade the backdrop (default duration = normal). */
  $effect(() => {
    if (phase !== "open") return;
    const surface = surfaceEl;
    const backdrop = backdropEl;
    if (!surface || !backdrop) return;
    transitionManager.enter({ el: surface, kind: "pop" });
    transitionManager.enter({ el: backdrop, kind: "fade" });
  });

  /**
   * Exit: both presets finish before `onDone` (the last one) flips phase to
   * "closed" and unmounts. Cancelled handles never fire `onDone` (the
   * transition manager contract), so reopening mid-close is safe.
   */
  $effect(() => {
    if (phase !== "closing") return;
    const surface = surfaceEl;
    const backdrop = backdropEl;
    if (!surface || !backdrop) return;
    let remaining = 2;
    const onExitDone = () => {
      remaining -= 1;
      if (remaining === 0) phase = "closed";
    };
    const surfaceHandle = transitionManager.exit({
      el: surface,
      kind: "pop",
      onDone: onExitDone,
    });
    const backdropHandle = transitionManager.exit({
      el: backdrop,
      kind: "fade",
      onDone: onExitDone,
    });
    return () => {
      surfaceHandle.cancel();
      backdropHandle.cancel();
    };
  });

  /** Portal the backdrop + surface onto portalTarget (ADR-0007 D2). */
  function portal(node: HTMLElement) {
    const target = portalTarget ?? document.body;
    target.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  /** Backdrop pointerdown closes; Escape is handled on the surface. */
  $effect(() => {
    if (!open) return;
    const backdrop = backdropEl;
    if (!backdrop) return;
    function onPointerDown(e: PointerEvent) {
      if (e.target === backdrop) onclose?.();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  });

  const focusables = (root: HTMLElement) =>
    Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

  /** Focus the first focusable on open, trap Tab, restore focus on close. */
  $effect(() => {
    if (!open) return;
    const surface = surfaceEl;
    if (!surface) return;
    // Non-null local so the closure doesn't depend on narrowing of `surface`.
    const root = surface;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = focusables(root);
    (focusable[0] ?? root).focus();

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onclose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables(root);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    root.addEventListener("keydown", onKeydown);

    return () => {
      root.removeEventListener("keydown", onKeydown);
      previouslyFocused?.focus();
    };
  });
</script>

{#if phase !== "closed"}
  <div bind:this={backdropEl} use:portal class="dex-modal">
    <div
      bind:this={surfaceEl}
      class={clsx("dex-modal__surface", className)}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId ?? ariaLabelledby}
      aria-describedby={descriptionId}
      tabindex="-1"
      {...rest}
    >
      {#if header}
        <div class="dex-modal__header">
          {@render header()}
        </div>
      {:else if title}
        <div class="dex-modal__header">
          <h2 id={titleId} class="dex-modal__title">{title}</h2>
          <button
            type="button"
            class="dex-modal__close"
            aria-label="Close"
            onclick={onclose}
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>
      {/if}

      <div class="dex-modal__body">
        {#if description}
          <p id={descriptionId} class="dex-modal__description">
            {description}
          </p>
        {/if}
        {@render children?.()}
      </div>

      {#if footer}
        <div class="dex-modal__footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .dex-modal {
    position: fixed;
    inset: 0;
    z-index: var(--z-dialog);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
    background: var(--surface-1);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
  }

  .dex-modal__surface {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: var(--modal-max-width);
    max-height: 100%;
    overflow: hidden;
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    background: var(--surface-2);
    box-shadow:
      var(--shadow-xl),
      inset 0 1px 0 var(--glass-border-light);
    outline: none;
  }

  .dex-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--border-subtle);
  }

  .dex-modal__title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .dex-modal__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2);
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .dex-modal__close:hover {
    color: var(--text-primary);
  }

  .dex-modal__close:focus-visible {
    box-shadow: var(--focus-ring);
  }

  .dex-modal__body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-5);
    color: var(--text-secondary);
  }

  .dex-modal__description {
    margin: 0 0 var(--space-4);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .dex-modal__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-5);
    border-top: 1px solid var(--border-subtle);
  }
</style>
