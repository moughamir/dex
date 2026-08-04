# ADR-0004: Transparent Window Compositing Contract

- Status: Accepted
- Date: 2026-08-04
- Deciders: Principal Architect
- Scope: Window chrome, global CSS, and the rendering pipeline

## Context

The Tauri window is configured `fullscreen: true, transparent: true,
decorations: false` (`src-tauri/tauri.conf.json`). DEX is the operating layer
above Hyprland: the user's desktop, wallpaper, and Wayland compositor output
must be visible through the shell. AGENTS.md states: keep `html`/`body`
transparent, use `backdrop-filter` glass panels, never paint an opaque window
background.

The current `src/app.css` paints an opaque body gradient
(`radial-gradient(...), #05070b`) — violating the contract — and is not even
imported by any route, so the global reset is silently dead.

## Decision

1. **Transparency is a hard contract, not a style choice.** `html` and `body`
   backgrounds are always `transparent`. The HUD viewport area shows the
   desktop; all visual backdrop comes from glass surfaces
   (`backdrop-filter: blur(var(--dex-glass-blur))` over translucent
   `--dex-surface-*` tokens).
2. **No opaque full-window paint anywhere** — no `background: #...` on
   `body`, no fullscreen overlay layers with solid fill. Content panels may be
   opaque on their own surface, but never window-sized.
3. **Global CSS is actually wired**: `src/app.css` is imported by
   `src/routes/+layout.svelte` and `@import`s `ui/styles/tokens.css` first.
4. **GPU-first rendering** (later phases): the `graphics/` layer renders into
   a WebGL canvas that is itself transparent (`alpha: true`), composited under
   the DOM chrome. Animations stay on `transform`/`opacity` so the compositor
   never repaints; see ADR-0003 motion contract.
5. **Known trade-off**: glass blur is a compositor cost on every repaint.
   Blur radii stay within the token scale and panels avoid
   re-blurring-every-frame animations (blur is not animatable on transform
   path).

## Consequences

- The desktop shows through the shell; panels read as floating glass.
- Any new full-window layer must be translucent or transparent — review
  checklist item ("opaque window background?").
- Debugging transparent-window quirks (input regions, compositor artifacts) is
  a documented platform concern: verify on Hyprland, not in a browser tab.
