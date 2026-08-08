<script lang="ts">
  import { cva, type VariantProps } from "class-variance-authority";
  import { twMerge } from "tailwind-merge";
  import type { HTMLAttributes } from "svelte/elements";

  const variants = cva("bg-[color:var(--border-default)] shrink-0", {
    variants: {
      orientation: {
        horizontal: "h-px w-full",
        vertical: "w-px h-full",
      },
    },

    defaultVariants: {
      orientation: "horizontal",
    },
  });

  type Props = HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof variants> & {
      class?: string;
    };

  let { orientation, class: className, ...rest }: Props = $props();

  const classes = $derived(
    twMerge(
      variants({
        orientation,
      }),
      className,
    ),
  );
</script>

<div
  role="separator"
  aria-orientation={orientation}
  class={classes}
  {...rest}
></div>
