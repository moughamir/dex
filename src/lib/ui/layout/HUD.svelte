<script lang="ts">
  import TopBar from "./TopBar.svelte";
  import Dock from "./Dock.svelte";
  import StatusBar from "./StatusBar.svelte";
</script>

<div class="hud">
  <TopBar />
  <main class="viewport">
    <div class="grid"></div>

    <section class="center">
      <h1>OmniZya:DEX</h1>
      <p>Desktop Experience</p>
    </section>
  </main>

  <Dock />

  <StatusBar />
</div>

<style>
  .hud {
    width: 100vw;
    height: 100vh;

    display: grid;
    grid-template-rows:
      var(--dex-layout-topbar)
      1fr
      var(--dex-layout-dock)
      var(--dex-layout-statusbar);
  }

  .viewport {
    position: relative;
    overflow: hidden;
  }

  .grid {
    position: absolute;
    inset: 0;

    background: linear-gradient(var(--dex-grid-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--dex-grid-line) 1px, transparent 1px);

    background-size: var(--dex-layout-grid) var(--dex-layout-grid);
  }

  .center {
    position: absolute;
    inset: 0;

    display: grid;
    place-content: center;

    text-align: center;
  }

  h1 {
    font-size: var(--dex-font-size-display);
    letter-spacing: var(--dex-tracking-logo);
    color: var(--dex-accent);
  }

  p {
    margin-top: var(--dex-space-5);
    color: var(--dex-text-2);
    letter-spacing: var(--dex-tracking-caption);
  }
</style>
