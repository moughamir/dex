<script lang="ts">
  import AppShell from "./AppShell.svelte";
  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<AppShell>
  {@render children?.()}
</AppShell>
