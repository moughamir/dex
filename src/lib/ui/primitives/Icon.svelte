<script lang="ts">
    import { cva, type VariantProps } from "class-variance-authority";
    import { twMerge } from "tailwind-merge";
    import type { Component } from "svelte";

    const variants = cva("shrink-0 transition-colors duration-200", {
        variants: {
            size: {
                xs: "size-3",
                sm: "size-4",
                md: "size-5",
                lg: "size-6",
                xl: "size-8",
            },

            color: {
                default: "text-[color:var(--text-primary)]",
                muted: "text-[color:var(--text-muted)]",
                accent: "text-[color:var(--dex-primary)]",
                success: "text-[color:var(--dex-success)]",
                warning: "text-[color:var(--dex-warning)]",
                danger: "text-[color:var(--dex-danger)]",
                current: "text-current",
            },
        },

        defaultVariants: {
            size: "md",
            color: "default",
        },
    });

    type Props = VariantProps<typeof variants> & {
        icon: Component;
        class?: string;
    };

    let { icon: Icon, size, color, class: className }: Props = $props();

    const classes = $derived(
        twMerge(
            variants({
                size,
                color,
            }),
            className,
        ),
    );
</script>

<Icon class={classes} />
