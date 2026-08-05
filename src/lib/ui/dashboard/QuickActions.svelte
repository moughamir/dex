<script lang="ts">
	import {
		Bot,
		FolderPlus,
		Plug,
		Database
	} from "lucide-svelte";

	import { Button } from "$lib/ui/primitives";
	import Widget from "./Widget.svelte";
</script>

<Widget
	title="Quick Actions"
>

	<div class="grid grid-cols-2 gap-3">

		<Button>
			<FolderPlus />
			Project
		</Button>

		<Button>
			<Bot />
			Agent
		</Button>

		<Button>
			<Database />
			Database
		</Button>

		<Button>
			<Plug />
			Plugin
		</Button>

	</div>

</Widget>
