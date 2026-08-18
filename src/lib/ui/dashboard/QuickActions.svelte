<script lang="ts">
  import { Bot, FolderPlus, Plug, Database } from "lucide-svelte";

  import { Button } from "$lib/ui/primitives";
  import Widget from "./Widget.svelte";
</script>

<Widget title="Quick Actions">
  <div class="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
    <Button variant="secondary">
      <FolderPlus />
      Project
    </Button>

    <Button variant="secondary">
      <Bot />
      Agent
    </Button>

    <Button variant="secondary">
      <Database />
      Database
    </Button>

    <Button variant="secondary">
      <Plug />
      Plugin
    </Button>
  </div>
</Widget>
