<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		columns?: 1 | 2 | 3 | 4;
		children?: Snippet;
	}

	let {
		columns = 3,
		children
	}: Props = $props();

	const classes = $derived.by(() => {

		switch (columns) {

			case 1:
				return "grid grid-cols-1 gap-6";

			case 2:
				return "grid grid-cols-1 gap-6 sm:grid-cols-2";

			case 4:
				return "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4";

			default:
				return "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3";
		}

	});
</script>

<div class={classes}>
	{@render children?.()}
</div>
