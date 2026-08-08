<script lang="ts">
  import { ScrollText } from "lucide-svelte";
  import { ViewPlaceholder } from "$lib/ui/primitives";
</script>

<ViewPlaceholder
  title="Agent Logs"
  description="Raw output, stdout traces, and error logs for agent operations"
  category="Agents"
  icon={ScrollText}
/>
