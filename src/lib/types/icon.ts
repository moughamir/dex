import type { SvelteComponent } from "svelte";

export type IconComponent = new (
	options: ConstructorParameters<typeof SvelteComponent>[0]
) => SvelteComponent;
