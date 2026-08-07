<script lang="ts">
	import { cva, type VariantProps } from "class-variance-authority";
	import { twMerge } from "tailwind-merge";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import type { Component, Snippet } from "svelte";

	const buttonVariants = cva(
		[
			"inline-flex",
			"items-center",
			"justify-center",
			"gap-2",
			"select-none",
			"font-medium",
			"transition-all",
			"duration-200",
			"outline-none",
			"disabled:pointer-events-none",
			"disabled:opacity-50"
		],
		{
			variants: {
				variant: {
					primary: [
						"dex-glass",
						"dex-glass-elevated",
						"text-[color:var(--text-primary)]",
						"border-[color:var(--dex-primary)]"
					],

					secondary: [
						"dex-glass",
						"text-[color:var(--text-primary)]"
					],

					ghost: [
						"bg-transparent",
						"border",
						"border-transparent",
						"hover:bg-[color:var(--surface-2)]"
					],

					danger: [
						"bg-[color:var(--dex-danger)]",
						"text-white"
					]
				},

				size: {
					xs: "h-8 px-3 text-xs",
					sm: "h-9 px-4 text-sm",
					md: "h-11 px-5 text-sm",
					lg: "h-12 px-6 text-base",
					xl: "h-14 px-8 text-lg",

					icon: "size-11 p-0"
				},

				rounded: {
					sm: "rounded-md",
					md: "rounded-lg",
					lg: "rounded-xl",
					full: "rounded-full"
				},

				glow: {
					true: "dex-glow",
					false: ""
				},

				interactive: {
					true: "dex-interactive",
					false: ""
				}
			},

			defaultVariants: {
				variant: "primary",
				size: "md",
				rounded: "lg",
				glow: false,
				interactive: true
			}
		}
	);

	type Props =
		HTMLButtonAttributes &
		VariantProps<typeof buttonVariants> & {

			leftIcon?: Component;

			rightIcon?: Component;

			loading?: boolean;

			children?: Snippet;

			class?: string;
		};

	let {
		variant,
		size,
		rounded,
		glow,
		interactive,

		leftIcon: LeftIcon,
		rightIcon: RightIcon,

		loading = false,

		children,

		class: className,

		disabled,

		...rest
	}: Props = $props();

	const classes = $derived(
		twMerge(
			buttonVariants({
				variant,
				size,
				rounded,
				glow,
				interactive
			}),
			className
		)
	);
</script>

<button
	class={classes}
	disabled={disabled || loading}
	{...rest}
>
	{#if loading}
		<div
			class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
		>

		</div>
	{:else}
		{#if LeftIcon}
			<LeftIcon class="size-4 shrink-0" />
		{/if}
	{/if}

	{@render children?.()}

	{#if !loading && RightIcon}
		<RightIcon class="size-4 shrink-0" />
	{/if}
</button>
