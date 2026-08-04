<script lang="ts">
	import { clsx } from "clsx";
	import { icons, type IconName } from "./icons";

	let {
		name,
		size = 20,
		class: className,
	}: {
		name: IconName;
		size?: number;
		class?: string;
	} = $props();
</script>

<!-- aria-hidden: icons are decorative; the interactive owner supplies the label -->
<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={clsx("dex-icon", className)}
	aria-hidden="true"
>
	{@html icons[name]}
</svg>

<style>
	.dex-icon {
		display: block;
		flex-shrink: 0;
	}
</style>
