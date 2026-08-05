/**
 * UI primitives — barrel export. Components must import primitives from here,
 * not from individual files, so the public surface stays reviewable.
 */
export { default as GlassPanel } from "./GlassPanel.svelte";
export { default as Button } from "./Button.svelte";
export { default as Badge } from "./Badge.svelte";
export { default as Separator } from "./Separator.svelte";
export { default as Icon } from "./Icon.svelte";
export { default as Tooltip } from "./Tooltip.svelte";
export { default as Divider } from "./Divider.svelte";
export { icons } from "./icons";
export type { IconName } from "./icons";
