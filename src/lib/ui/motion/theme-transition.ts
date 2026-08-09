import type { ThemeName } from "$lib/core/config/theme";
import { themeStore } from "$lib/core/stores/theme.svelte";
import { motionManager } from "./motion-manager.svelte";
import { presets } from "./presets";
import { createTimeline, type TimelineStep } from "./timeline";
import { DURATION } from "./types";

/**
 * Cross-fade between themes — the THEME-TRANSITION carve-out (ADR-0003
 * amendment, ADR-0009). Runs a two-step timeline on `<html>` (fade out, swap,
 * fade in) with the `--motion-theme-*` mirrored values (slower 600ms / smooth),
 * applying the new theme at the opacity floor, then resolves. Under reduced
 * motion — or on the first apply (boot path, before any `data-theme` exists) —
 * the theme is applied instantly with no animation.
 */
export async function transitionTheme(next: ThemeName): Promise<void> {
  if (motionManager.reduced || !themeAlreadyApplied()) {
    themeStore.apply(next);
    return;
  }

  const root = document.documentElement;
  const steps: TimelineStep[] = [
    {
      el: root,
      keyframes: presets.fade.exit,
      options: { duration: "slower", easing: "smooth", fill: "both" },
      at: 0,
    },
    {
      el: root,
      keyframes: presets.fade.enter,
      options: { duration: "slower", easing: "smooth", fill: "both" },
      at: DURATION.slower,
    },
  ];
  const timeline = createTimeline(steps, motionManager);
  timeline.play();

  // Swap the palette at the opacity floor (end of the fade-out step).
  await new Promise<void>((resolve) => setTimeout(resolve, DURATION.slower));
  themeStore.apply(next);

  await timeline.finished;
}

function themeAlreadyApplied(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.documentElement.dataset.theme);
}
