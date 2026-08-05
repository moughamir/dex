<script lang="ts">
	import { onMount } from "svelte";

	let x = $state(window.innerWidth / 2);
	let y = $state(window.innerHeight / 2);

	function update(event: PointerEvent) {
		x = event.clientX;
		y = event.clientY;
	}

	$effect(() => {
		document.documentElement.style.setProperty("--cursor-x", `${x}px`);
		document.documentElement.style.setProperty("--cursor-y", `${y}px`);
	});

	onMount(() => {
		window.addEventListener("pointermove", update);

		return () => {
			window.removeEventListener("pointermove", update);
		};
	});
</script>

<div class="dex-effect">
	<div class="dex-cursor-glow"></div>
</div>
