<script lang="ts">
  /**
   * Live FPS readout for the graphics layer. Mounted by GraphicsBackdrop as a
   * sibling of the backdrop container so it renders above the -z-50 canvas —
   * visible chrome, never an input target (ADR-0004).
   *
   * The source is a structural interface rather than the concrete
   * GraphicsRenderer, so tests can inject a fake and this component never
   * touches Three.js or the graphics layer (dependency direction ui →
   * graphics stays acyclic).
   */

  interface FpsSource {
    subscribeFps(callback: (fps: number) => void): () => void;
  }

  interface Props {
    /** Renderer exposing the FPS telemetry seam, or null when none exists. */
    renderer?: FpsSource | null;
  }

  let { renderer = null }: Props = $props();

  /** Latest smoothed FPS sample; null until the first one arrives. */
  let fps = $state<number | null>(null);

  // Subscribe for the lifetime of the source. The effect re-runs whenever
  // `renderer` changes, unsubscribing from the previous source via the
  // returned cleanup. `fps` resets on swap so a replaced renderer never shows
  // a stale value. The meter emits ~2 samples/sec.
  $effect(() => {
    const source = renderer;
    if (!source) return;
    fps = null;
    return source.subscribeFps((value) => {
      fps = value;
    });
  });

  const label = $derived(fps === null ? "—" : `${Math.round(fps)} fps`);
</script>

<div class="fps-chip" aria-label="Frames per second">{label}</div>

<style>
  .fps-chip {
    /* Fixed bottom-right chrome, clear of the status strip (its height) and
       its right-aligned clock — offset by one spacing step above it. */
    position: fixed;
    right: var(--space-6);
    bottom: calc(var(--status-height) + var(--space-2));
    z-index: var(--z-floating);

    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);

    background: linear-gradient(
      180deg,
      var(--glass-medium),
      var(--glass-light)
    );
    backdrop-filter: blur(var(--blur-sm));
    -webkit-backdrop-filter: blur(var(--blur-sm));
    box-shadow: var(--shadow-sm);

    color: var(--text-muted);
    font-size: var(--font-size-xs);
    font-variant-numeric: tabular-nums;

    /* ADR-0004: a passive readout must never intercept pointer events. */
    pointer-events: none;
    user-select: none;
  }
</style>
