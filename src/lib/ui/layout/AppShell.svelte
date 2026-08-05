<script lang="ts">
	import Background from "$lib/ui/effects/Background.svelte";

	import TopBar from "./TopBar.svelte";
	import Sidebar from "./Sidebar.svelte";
	import Dock from "./Dock.svelte";
	import StatusBar from "./StatusBar.svelte";

	import type { Snippet } from "svelte";

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="relative h-screen w-screen overflow-hidden bg-transparent text-(--text-primary)">

	<Background />

	<TopBar />

	<div class="flex h-full pt-(--hud-height)">
		<Sidebar />

		<main class="relative flex-1 overflow-auto p-8">
			{@render children?.()}
		</main>
	</div>

	<Dock />

	<StatusBar />

</div>
