<script lang="ts">
  import "../app.css";
  import { initTheme } from "$lib/core/stores/theme.svelte";

  // Shell boot: apply the persisted theme before first paint.
  initTheme();
</script>

<slot />
