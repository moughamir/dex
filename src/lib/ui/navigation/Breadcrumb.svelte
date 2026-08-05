<script lang="ts">
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
	{#each items as item, i}
		{#if i > 0}
			<span class="text-(--text-muted)"> / </span>
		{/if}

		<a href={item.href} class="transition hover:text-(--dex-primary)">
			{item.label}
		</a>
	{/each}
</nav>
