<svelte:options immutable />

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
			rgb(28 30 38 / 0.42),
			rgb(18 20 28 / 0.3)
		);

		backdrop-filter: blur(var(--blur-lg)) saturate(185%) brightness(1.05);
		box-shadow:
			0 18px 60px rgb(0 0 0 / 0.38),
			inset 0 1px 0 rgb(255 255 255 / 0.12),
			inset 0 -1px 0 rgb(255 255 255 / 0.03);
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease,
			border-color 0.25s ease;
	}

	.dex-glass::before {
		content: "";

		position: absolute;
		inset: 0;

		background: linear-gradient(
			180deg,
			rgb(255 255 255 / 0.1),
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
			rgb(255 255 255 / 0.18),
			transparent 70%
		);

		opacity: 0.22;
		filter: blur(060px);
	}

	.dex-glass__reflection {
		position: absolute;
		inset: 0;

		background: linear-gradient(
			120deg,
			transparent 20%,
			rgb(255 255 255 / 0.05) 45%,
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
		transform: translateY(-4px);

		border-color: rgb(255 255 255 / 0.18);

		box-shadow:
			0 32px 80px rgb(0 0 0 / 0.35),
			0 0 30px rgb(120 170 255 / 0.08),
			inset 0 1px 0 rgb(255 255 255 / 0.2);
	}

	.dex-glass--glow {
		box-shadow:
			0 0 40px rgb(100 160 255 / 0.12),
			0 24px 70px rgb(0 0 0 / 0.32),
			inset 0 1px 0 rgb(255 255 255 / 0.18);
	}

	.dex-glass--hud {
		background: linear-gradient(
			180deg,
			rgb(255 255 255 / 0.14),
			rgb(255 255 255 / 0.05)
		);
	}

	.dex-glass--sidebar {
		background: linear-gradient(
			180deg,
			rgb(255 255 255 / 0.08),
			rgb(255 255 255 / 0.03)
		);
	}

	.dex-glass--dock {
		background: linear-gradient(
			180deg,
			rgb(255 255 255 / 0.12),
			rgb(255 255 255 / 0.05)
		);
		box-shadow:
			0 28px 80px rgb(0 0 0 /0.45),
			inset 0 1px 0 rgb(255 255 255 /0.1);
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
