<script lang="ts">
	import type { Snippet } from "svelte";
	import type { IconComponent } from "$lib/types/icon";

	interface Props {
		title: string;
		subtitle?: string;

		icon?: IconComponent;

		actions?: Snippet;
	}

	let {
		title,
		subtitle,
		icon: Icon,
		actions
	}: Props = $props();
</script>

<header class="mb-5 flex items-start justify-between gap-4">

	<div class="flex items-center gap-3">

		{#if Icon}
			<div class="rounded-xl bg-(--surface-3) p-3">
				<Icon class="size-5 text-(--dex-primary)" />
			</div>
		{/if}

		<div>

			<h2 class="text-lg font-semibold">
				{title}
			</h2>

			{#if subtitle}
				<p class="text-sm text-(--text-muted)">
					{subtitle}
				</p>
			{/if}

		</div>

	</div>

	{#if actions}
		<div class="flex items-center gap-2">
			{@render actions()}
		</div>
	{/if}

</header>
