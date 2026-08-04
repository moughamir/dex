<script lang="ts">
  let time = $state("");

  const update = () =>
    (time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }));

  update();
  setInterval(update, 1000);
</script>

<header>
  <div class="logo">DEX</div>

  <div class="clock">{time}</div>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 var(--dex-space-7);
    color: var(--dex-text-1);
    backdrop-filter: blur(var(--dex-blur-glass));

    background: var(--dex-surface-1);

    border-bottom: 1px solid var(--dex-border);
  }

  .logo {
    font-weight: var(--dex-font-weight-bold);
    letter-spacing: var(--dex-tracking-logo);
    color: var(--dex-accent);
  }

  /* data/digits render in the mono face (design language) */
  .clock {
    font-family: var(--dex-font-mono);
    letter-spacing: var(--dex-tracking-wide);
  }
</style>
