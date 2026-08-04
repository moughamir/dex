<script lang="ts">
  import { Icon, type IconName } from "$lib/ui/primitives";

  /**
   * Dock launcher entries. `label` is the accessible name (aria-label) —
   * icons are decorative, so every button must be labelled.
   */
  const apps: readonly { icon: IconName; label: string }[] = [
    { icon: "home", label: "Home" },
    { icon: "display", label: "Display" },
    { icon: "file-text", label: "Files" },
    { icon: "zap", label: "Zap" },
    { icon: "bot", label: "Bot" },
    { icon: "settings", label: "Settings" },
  ];
</script>

<nav>
  {#each apps as app}
    <button aria-label={app.label}>
      <Icon name={app.icon} size={24} />
    </button>
  {/each}
</nav>

<style>
  nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--dex-space-6);

    background: var(--dex-surface-1);

    backdrop-filter: blur(var(--dex-blur-glass));

    border-top: 1px solid var(--dex-border);
  }

  button {
    position: relative;

    width: var(--dex-layout-dock-button);
    height: var(--dex-layout-dock-button);

    border: none;

    border-radius: var(--dex-radius-lg);

    background: var(--dex-surface-3);

    color: var(--dex-text-1);

    cursor: pointer;

    /* motion rule: transform/opacity only */
    transition:
      transform var(--dex-duration-base) var(--dex-ease-out),
      opacity var(--dex-duration-base) var(--dex-ease-out);
  }

  /* hover wash fades in via opacity (compositor-friendly) */
  button::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--dex-accent-soft);
    opacity: 0;
    transition: opacity var(--dex-duration-base) var(--dex-ease-out);
    pointer-events: none;
  }

  button:hover {
    transform: translateY(calc(-1 * var(--dex-space-2)));
  }

  button:hover::before {
    opacity: 1;
  }

  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--dex-focus-ring);
  }

  @media (prefers-reduced-motion: reduce) {
    button,
    button::before {
      transition: none;
    }
  }
</style>
