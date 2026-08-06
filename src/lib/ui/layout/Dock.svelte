<script lang="ts">
	import { DOCK_WORKSPACES } from "$lib/core/config/navigation";

	import { Button, GlassPanel } from "$lib/ui/primitives";
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
		{#each DOCK_WORKSPACES as workspace (workspace.id)}
			<Button
				size="icon"
				variant="ghost"
				rounded="full"
			>
				<workspace.icon />
			</Button>
		{/each}
	</GlassPanel>
</div>
