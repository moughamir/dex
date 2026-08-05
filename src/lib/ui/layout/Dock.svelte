<script lang="ts">
	import {
		Bot,
		Database,
		FolderKanban,
		Home,
		Package
	} from "lucide-svelte";

	import { Button, GlassPanel } from "$lib/ui/primitives";

	const apps = [
		Home,
		FolderKanban,
		Database,
		Bot,
		Package
	];
</script>

<div
	class="pointer-events-none absolute bottom-6 left-1/2 z-(--z-dock) -translate-x-1/2"
>
	<GlassPanel
		variant="dock"
		padding="sm"
		radius="full"
		class="pointer-events-auto flex items-center gap-2"
	>
		{#each apps as Icon}
			<Button
				size="icon"
				variant="ghost"
				rounded="full"
			>
				<Icon />
			</Button>
		{/each}
	</GlassPanel>
</div>
