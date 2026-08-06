<script lang="ts">
	import { Bell, Settings2, Search } from "lucide-svelte";

	import { shellStore } from "$lib/core/stores/shell.svelte";
	import { workspaceLabel } from "$lib/core/utils/helpers";

	import { Button, GlassPanel } from "$lib/ui/primitives";
	import { SearchBox } from "$lib/ui/navigation";

	const label = $derived(workspaceLabel(shellStore.activeWorkspace));

	let query = $state("");
	let searchOpen = $state(false);
</script>

<header
	class="absolute inset-x-0 top-0 z-(--z-hud) flex h-(--hud-height) items-center px-6"
	data-tauri-drag-region
>
	<GlassPanel
		variant="hud"
		padding="sm"
		class="flex h-full w-full items-center gap-4"
	>
		<div class="flex items-center gap-3" data-tauri-drag-region>
			<div
				class="flex size-10 items-center justify-center rounded-xl bg-(--dex-primary) font-bold text-black"
			>
				D
			</div>

			<div>
				<h1 class="text-sm font-semibold">DEX</h1>

				<p class="text-xs text-(--text-muted)">
					{label}
				</p>
			</div>
		</div>

		<div class="flex-1"></div>

		{#if searchOpen}
			<div class="w-full max-w-md">
				<SearchBox bind:value={query} />
			</div>
		{/if}

		<Button variant="ghost" size="icon" onclick={() => (searchOpen = !searchOpen)}>
			<Search />
		</Button>

		<Button variant="ghost" size="icon">
			<Bell />
		</Button>

		<Button variant="ghost" size="icon">
			<Settings2 />
		</Button>
	</GlassPanel>
</header>
