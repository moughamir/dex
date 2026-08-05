<script lang="ts">
	import { cva, type VariantProps } from "class-variance-authority";
	import { twMerge } from "tailwind-merge";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	const variants = cva(
		[
			"inline-flex",
			"items-center",
			"justify-center",
			"rounded-full",
			"px-2.5",
			"py-1",
			"text-xs",
			"font-medium",
			"border"
		],
		{
			variants: {
				variant: {
					default:
						"dex-glass text-[color:var(--text-primary)] border-[color:var(--border-default)]",

					accent:
						"bg-[color:var(--dex-primary)] text-white border-transparent",

					success:
						"bg-[color:var(--dex-success)] text-white border-transparent",

					warning:
						"bg-[color:var(--dex-warning)] text-black border-transparent",

					danger:
						"bg-[color:var(--dex-danger)] text-white border-transparent"
				}
			},

			defaultVariants: {
				variant: "default"
			}
		}
	);

	type Props =
		HTMLAttributes<HTMLSpanElement> &
		VariantProps<typeof variants> & {
			children?: Snippet;
			class?: string;
		};

	let {
		variant,
		children,
		class: className,
		...rest
	}: Props = $props();

	const classes = $derived(
		twMerge(
			variants({
				variant
			}),
			className
		)
	);
</script>

<span
	class={classes}
	{...rest}
>
	{@render children?.()}
</span>
