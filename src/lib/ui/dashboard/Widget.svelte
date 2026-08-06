<script lang="ts">
	import type { Snippet } from "svelte";

	import GlassPanel from "$lib/ui/primitives/GlassPanel.svelte";
	import WidgetHeader from "./WidgetHeader.svelte";
	import type { IconComponent } from "$lib/types/icon";


	interface Props {

		title: string;

		subtitle?: string;

		icon?: IconComponent;

		actions?: Snippet;

		children?: Snippet;

		class?: string;
	}

	let {
		title,
		subtitle,
		icon,
		actions,
		children,
		class: className = ""
	}: Props = $props();
</script>

<GlassPanel
	interactive
	class={`h-full ${className}`}
>

	<WidgetHeader
		{title}
		{subtitle}
		{icon}
		{actions}
	/>

	<div class="h-full">
		{@render children?.()}
	</div>

</GlassPanel>
