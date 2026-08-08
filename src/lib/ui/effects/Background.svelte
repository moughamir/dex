<script lang="ts">
  import Aurora from "./Aurora.svelte";
  import Noise from "./Noise.svelte";
  import Grid from "./Grid.svelte";
  import Spotlight from "./Spotlight.svelte";
  import CursorGlow from "./CursorGlow.svelte";
  import Vignette from "./Vignette.svelte";
</script>

<div class="absolute inset-0 -z-50 overflow-hidden">
  <Aurora />

  <Spotlight />

  <Grid />

  <Noise />

  <CursorGlow />

  <Vignette />
</div>
