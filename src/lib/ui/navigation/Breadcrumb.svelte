<script lang="ts">
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";

	interface Item {
		label: string;
		href?: string;
	}

	interface Props {
		items: Item[];
	}

	let { items }: Props = $props();
</script>

<nav class="flex items-center gap-2 text-sm">
	{#each items as item, i (item.label)}
		{#if i > 0}
			<span class="text-(--text-muted)"> / </span>
		{/if}

		<a
			href={item.href ? resolve(item.href as Pathname) : undefined}
			class="transition hover:text-(--dex-primary)"
		>
			{item.label}
		</a>
	{/each}
</nav>
