<script lang="ts">
	import { shellStore } from "$lib/core/stores/shell.svelte";
	import { DOCK_WORKSPACES } from "$lib/core/config/navigation";

	const now = $state(new Date());

	$effect(() => {
		const timer = setInterval(() => {
			now.setTime(now.getTime() + 1000);
		}, 1000);

		return () => clearInterval(timer);
	});

	const time = $derived(
		now.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		})
	);

	const workspaceLabel = $derived(
		DOCK_WORKSPACES.find(
			(workspace) => workspace.id === shellStore.activeWorkspace
		)?.label
	);
</script>

<footer
	class="absolute bottom-0 left-0 right-0 z-(--z-status) flex h-(--status-height) items-center justify-between px-6 text-xs text-(--text-muted)"
>
	<div>DEX v0.1.0 · {workspaceLabel}</div>

	<div>{time}</div>
</footer>
