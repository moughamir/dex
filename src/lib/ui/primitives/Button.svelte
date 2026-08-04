<script lang="ts">
	import { cva, type VariantProps } from "class-variance-authority";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	/**
	 * Action button. Variants: primary (accent-filled), ghost (outline),
	 * glass (raised fill). Forwards native button props (`onclick`, `disabled`,
	 * `aria-label`, ...) via rest props. Icon-only buttons MUST pass
	 * `aria-label`.
	 */

	const button = cva("dex-button", {
		variants: {
			variant: {
				primary: "dex-button--primary",
				ghost: "dex-button--ghost",
				glass: "dex-button--glass",
			},
			size: {
				sm: "dex-button--sm",
				md: "dex-button--md",
				lg: "dex-button--lg",
			},
		},
		defaultVariants: {
			variant: "glass",
			size: "md",
		},
	});

	type ButtonVariants = VariantProps<typeof button>;

	interface ButtonProps extends HTMLButtonAttributes {
		variant?: ButtonVariants["variant"];
		size?: ButtonVariants["size"];
		class?: string;
		children?: Snippet;
	}

	let {
		variant,
		size,
		type = "button",
		class: className,
		children,
		...restProps
	}: ButtonProps = $props();

	const classes = $derived(button({ variant, size, className }));
</script>

<button {...restProps} {type} class={classes}>
	{@render children?.()}
</button>

<style>
	.dex-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--dex-space-2);
		border-radius: var(--dex-radius-md);
		border: 1px solid transparent;
		font-family: var(--dex-font-sans);
		font-size: var(--dex-font-size-sm);
		font-weight: var(--dex-font-weight-medium);
		letter-spacing: var(--dex-tracking-wide);
		color: var(--dex-text-1);
		background: transparent;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		/* motion rule: transform/opacity only */
		transition:
			transform var(--dex-duration-fast) var(--dex-ease-out),
			opacity var(--dex-duration-fast) var(--dex-ease-out);
	}

	/* hover wash fades in via opacity (compositor-friendly, per motion rule) */
	.dex-button::before {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: var(--dex-white-a08);
		opacity: 0;
		transition: opacity var(--dex-duration-base) var(--dex-ease-out);
		pointer-events: none;
	}

	.dex-button:hover {
		transform: translateY(calc(-1 * var(--dex-space-1)));
	}

	.dex-button:hover::before {
		opacity: 1;
	}

	.dex-button:active {
		transform: translateY(0);
	}

	.dex-button--primary {
		background: var(--dex-accent-strong);
		color: var(--dex-on-accent);
	}

	.dex-button--primary::before {
		background: var(--dex-white-a12);
	}

	.dex-button--ghost {
		border-color: var(--dex-border);
	}

	.dex-button--ghost::before {
		background: var(--dex-accent-soft);
	}

	.dex-button--glass {
		background: var(--dex-surface-3);
		border-color: var(--dex-border-subtle);
	}

	.dex-button--glass::before {
		background: var(--dex-white-a08);
	}

	.dex-button--sm {
		padding: var(--dex-space-2) var(--dex-space-4);
		font-size: var(--dex-font-size-xs);
	}

	.dex-button--md {
		padding: var(--dex-space-3) var(--dex-space-5);
	}

	.dex-button--lg {
		padding: var(--dex-space-4) var(--dex-space-6);
		font-size: var(--dex-font-size-md);
	}

	.dex-button:disabled {
		opacity: var(--dex-opacity-disabled);
		cursor: not-allowed;
		transform: none;
	}

	.dex-button:disabled::before {
		opacity: 0;
	}

	.dex-button:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px var(--dex-focus-ring);
	}

	@media (prefers-reduced-motion: reduce) {
		.dex-button,
		.dex-button::before {
			transition: none;
		}
	}
</style>
