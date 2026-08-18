/**
 * M2.3 motion engine — public surface (ADR-0009).
 *
 * A rAF-free, compositor-driven motion engine: `ui/motion/` never schedules its
 * own frame loop (the renderer stays the sole continuous-loop owner) and drives
 * JS-orchestrated sequences through the Web Animations API (`Element.animate`)
 * behind a driver seam. Interaction states stay CSS-transition-driven.
 */
export { DURATION, EASE, type DurationToken, type EaseToken } from "./types";
export {
  type MotionDriver,
  type MotionHandle,
  createWebDriver,
} from "./driver";
export { presets } from "./presets";
export {
  MotionManager,
  createMotionManager,
  motionManager,
  type MotionAnimationOptions,
  type MotionManagerOptions,
} from "./motion-manager.svelte";
export { createTimeline, type Timeline, type TimelineStep } from "./timeline";
export {
  createTransitionManager,
  transitionManager,
  type EnterExitOptions,
  type TransitionManager,
} from "./transition-manager";
export { transitionTheme } from "./theme-transition";
