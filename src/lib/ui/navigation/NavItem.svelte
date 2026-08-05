<script lang="ts">
	import { cva, type VariantProps } from "class-variance-authority";
	import { twMerge } from "tailwind-merge";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import type { Snippet } from "svelte";

	const variants = cva(
		[
			"group",
			"flex",
			"items-center",
			"gap-3",
			"rounded-xl",
			"px-4",
			"py-3",
			"text-sm",
			"font-medium",
			"transition-all",
			"duration-200",
			"select-none"
		],
		{
			variants: {
				active: {
					true: [
						"bg-[color:var(--surface-3)]",
						"text-[color:var(--text-primary)]",
						"shadow-sm"
					],
					false: [
						"text-[color:var(--text-secondary)]",
						"hover:bg-[color:var(--surface-2)]",
						"hover:text-[color:var(--text-primary)]"
					]
				}
			},
			defaultVariants: {
				active: false
			}
		}
	);

	interface Props extends VariantProps<typeof variants> {
		label: string;
		href?: string;
		icon?: Snippet;
		badge?: Snippet;
		children?: Snippet;
		class?: string;
	}

	let {
		label,
		href = "#",
		icon,
		badge,
		children: _children,
		active,
		class: className
	}: Props = $props();

	const classes = $derived(
		twMerge(
			variants({ active }),
			className
		)
	);
</script>

<a
	href={href === "#" ? "#" : resolve(href as Pathname)}
	class={classes}
>
	{#if icon}
		<div class="flex size-5 items-center justify-center">
			{@render icon()}
		</div>
	{/if}

	<span class="flex-1">
		{label}
	</span>

	{#if badge}
		{@render badge()}
	{/if}
</a>
