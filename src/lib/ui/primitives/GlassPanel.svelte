<script lang="ts">
	import { clsx } from "clsx";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	type GlassElement =
		"div" | "section" | "aside" | "header" | "footer" | "nav" | "main";

	type GlassVariant =
		"panel" | "hud" | "sidebar" | "dock" | "raised" | "floating";

	type GlassPadding = "none" | "sm" | "md" | "lg";

	type GlassRadius = "md" | "lg" | "xl" | "full";

	interface Props extends HTMLAttributes<HTMLElement> {
		element?: GlassElement;
		variant?: GlassVariant;
		padding?: GlassPadding;
		radius?: GlassRadius;
		glow?: boolean;
		interactive?: boolean;
		class?: string;
		children?: Snippet;
	}

	let {
		element = "div",
		variant = "panel",
		padding = "md",
		radius = "xl",
		glow = false,
		interactive = false,
		class: className,
		children,
		...rest
	}: Props = $props();

	const classes = $derived(
		clsx(
			"dex-glass",
			`dex-glass--${variant}`,
			`dex-padding--${padding}`,
			`dex-radius--${radius}`,
			{
				"dex-glass--glow": glow,
				"dex-glass--interactive": interactive,
			},
			className,
		),
	);
</script>

<svelte:element this={element} class={classes} {...rest}>
	<div class="dex-glass__highlight"></div>

	<div class="dex-glass__reflection"></div>
	<div class="dex-glass__content">
		{@render children?.()}
	</div>
</svelte:element>

<style>
	.dex-glass {
		position: relative;

		overflow: hidden;

		border: 1px solid var(--glass-border);
		background: linear-gradient(
			180deg,
			var(--surface-2),
			var(--surface-1)
		);

		backdrop-filter: blur(var(--blur-lg)) saturate(185%) brightness(1.05);
		box-shadow:
			var(--shadow-lg),
			inset 0 1px 0 var(--glass-border-light),
			inset 0 -1px 0 var(--border-subtle);
		transition:
			transform var(--duration-normal) var(--ease-standard),
			box-shadow var(--duration-normal) var(--ease-standard),
			border-color var(--duration-normal) var(--ease-standard);
	}

	.dex-glass::before {
		content: "";

		position: absolute;
		inset: 0;

		background: linear-gradient(
			180deg,
			var(--glass-light),
			transparent 45%
		);

		pointer-events: none;
	}

	.dex-glass__highlight {
		position: absolute;

		width: 280px;
		height: 280px;

		left: -120px;
		top: -160px;

		border-radius: 999px;

		background: radial-gradient(
			circle,
			var(--glass-ultra),
			transparent 70%
		);

		opacity: 0.22;
		filter: blur(60px);
	}

	.dex-glass__reflection {
		position: absolute;
		inset: 0;

		background: linear-gradient(
			120deg,
			transparent 20%,
			var(--glass-light) 45%,
			transparent 70%
		);
		opacity: 0.18;
		pointer-events: none;
	}

	.dex-glass__content {
		position: relative;
		z-index: 1;
	}

	.dex-glass--interactive:hover {
		transform: translateY(-2px);

		border-color: var(--glass-border-strong);

		box-shadow:
			var(--shadow-xl),
			var(--shadow-accent),
			inset 0 1px 0 var(--glass-border-light);
	}

	.dex-glass--glow {
		box-shadow:
			var(--shadow-accent),
			var(--shadow-lg),
			inset 0 1px 0 var(--glass-border-light);
	}

	.dex-glass--hud {
		background: var(--hud-bg);
	}

	.dex-glass--sidebar {
		background: var(--sidebar-bg);
	}

	.dex-glass--dock {
		background: var(--dock-bg);
		box-shadow:
			var(--shadow-lg),
			inset 0 1px 0 var(--glass-border-light);
		backdrop-filter: blur(var(--blur-md)) saturate(200%);
	}

	.dex-glass--floating {
		backdrop-filter: blur(var(--blur-xl)) saturate(220%);
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

	.dex-radius--md {
		border-radius: var(--radius-lg);
	}

	.dex-radius--lg {
		border-radius: var(--radius-xl);
	}

	.dex-radius--xl {
		border-radius: var(--radius-2xl);
	}

	.dex-radius--full {
		border-radius: var(--radius-full);
	}
</style>
