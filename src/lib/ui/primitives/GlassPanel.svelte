<script lang="ts">
	import { clsx } from "clsx";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	/**
	 * Canonical glass surface: backdrop blur + semantic surface + hairline
	 * border + radius. Use it for every chrome "panel" so the glass look stays
	 * consistent. Consumers may restyle via `class` and rest props.
	 */

	type GlassElement =
		| "div"
		| "section"
		| "aside"
		| "nav"
		| "header"
		| "footer"
		| "main";
	type GlassVariant = "panel" | "elevated" | "raised";

	interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
		element?: GlassElement;
		/** panel: default surface · elevated: more opaque + stronger hairline · raised: light fill */
		variant?: GlassVariant;
		/** accent edge glow for emphasis */
		glow?: boolean;
		class?: string;
		children?: Snippet;
	}

	let {
		element = "div",
		variant = "panel",
		glow = false,
		class: className,
		children,
		...restProps
	}: GlassPanelProps = $props();

	const classes = $derived(
		clsx("dex-glass", `dex-glass--${variant}`, { "dex-glass--glow": glow }, className),
	);
</script>

<svelte:element this={element} class={classes} {...restProps}>
	{@render children?.()}
</svelte:element>

<style>
	.dex-glass {
		position: relative;
		border-radius: var(--dex-radius-lg);
		border: 1px solid var(--dex-border-subtle);
		backdrop-filter: blur(var(--dex-blur-glass));
	}

	.dex-glass--panel {
		background: var(--dex-surface-1);
	}

	.dex-glass--elevated {
		background: var(--dex-surface-2);
		border-color: var(--dex-border);
	}

	.dex-glass--raised {
		background: var(--dex-surface-3);
	}

	.dex-glass--glow {
		box-shadow:
			0 0 var(--dex-space-8) var(--dex-accent-soft),
			inset 0 0 0 1px var(--dex-accent-soft);
	}
</style>
