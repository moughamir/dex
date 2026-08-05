import type { SvelteComponent } from "svelte";

export type IconComponent = new (...args: any[]) => SvelteComponent;
