<script lang="ts">
	import { Search } from "lucide-svelte";

	interface Props {
		placeholder?: string;
		value?: string;
	}

	let {
		placeholder = "Search...",
		value = $bindable("")
	}: Props = $props();
</script>

<div class="relative">

	<Search
		class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--text-muted)"
	/>

	<input
		bind:value
		type="search"
		placeholder={placeholder}
		class="h-10 w-full rounded-xl border border-(--border-default) bg-(--surface-2) pl-10 pr-4 outline-none transition focus:border-(--dex-primary)"
	/>

</div>
