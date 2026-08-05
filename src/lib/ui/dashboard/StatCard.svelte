<script lang="ts">
	import type { IconComponent } from "$lib/types/icon";
	import Widget from "./Widget.svelte";

	interface Props {

		title: string;

		value: string | number;

		icon: IconComponent;

		change?: string;
	}

	let {
		title,
		value,
		icon,
		change
	}: Props = $props();
</script>

<Widget
	{title}
	{icon}
	class="min-h-42.5"
>

	<div class="flex h-full flex-col justify-end">

		<h2 class="text-4xl font-bold">
			{value}
		</h2>

		{#if change}
			<p class="mt-2 text-sm text-(--dex-success)">
				{change}
			</p>
		{/if}

	</div>

</Widget>
