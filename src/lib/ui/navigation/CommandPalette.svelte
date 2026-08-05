<script lang="ts">
	import SearchBox from "./SearchBox.svelte";

	let query = $state("");
</script>

<SearchBox
	bind:value={query}
	placeholder="Search commands..."
/>
