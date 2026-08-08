# Run Locally

## Purpose

This document explains the two ways to run DEX during development — `bun run
dev` (frontend only) and `bun run tauri:dev` (full desktop window) — what each
one exercises, and the runtime characteristics of the desktop window. Read it
before your first run so the difference is clear and the transparent-window
rules are understood.

## The two run modes and why both exist

DEX has a frontend half and a backend half. The two run commands give you two
different levels of the stack:

| Command | What runs | Needs a display? | What you can do |
|---|---|---|---|
| `bun run dev` | Vite dev server only (frontend in a browser tab) | no | Iterate on UI layout, tokens, primitives, and theme switching |
| `bun run tauri:dev` | Vite dev server **plus** the Tauri window (Rust process + WebKit) | yes (Wayland/Hyprland) | Exercise the real window, IPC, logging plugin, and compositor behavior |

`bun run tauri:dev` always boots the frontend through the same Vite dev server
(`beforeDevCommand` in `src-tauri/tauri.conf.json` runs `bun run dev`), so
HMR works in both modes. The difference is what surrounds the frontend: a
browser tab versus the native Tauri window.

## Frontend only — `bun run dev`

```sh
bun run dev
```

**What happens:** Vite starts on port **1420** with `strictPort: true`
(`vite.config.js`). If the port is busy, Vite refuses to start rather than
silently moving — free the port or nothing runs.

**What it exercises:** the SvelteKit SPA (`src/routes/+page.svelte` renders
the HUD from `src/lib/ui/layout/`). Design tokens, primitives, layout, and
theme switching (`data-theme` on `<html>`) are all visible in the browser tab.
The logger facade in `src/lib/core/utils/logger.ts` detects that it is not
inside Tauri (`isTauri()` is false) and falls back to the browser console, so
frontend log output appears in DevTools.

**What it does NOT exercise:** Rust, IPC, plugins, the filesystem, or the
window itself. A feature that calls a contract client in `core/services/`
will fail inside a plain browser tab, because there is no Tauri runtime to
answer `invoke`. Use this mode for visual iteration, not for IPC work.

## Full desktop window — `bun run tauri:dev`

```sh
bun run tauri:dev
```

**What happens:** Tauri runs `bun run dev` as `beforeDevCommand`, waits for
`devUrl` (`http://localhost:1420`) to come up, then opens a native window and
loads the SPA into it. The Rust process runs the full shell: the two plugins
(`opener`, `log`), the single `invoke_handler`, and the registered commands:
`commands::core::greet` and `commands::core::set_complete`. Logs flow through
the log plugin to stdout and the app log directory.

**Requirements:**

- A running **Wayland** session with **Hyprland** — the window is created
  against the compositor.
- **webkit2gtk-4.1** installed (see [Build.md](Build.md)) — the WebKit engine
  the window renders into.
- A display. `bun run tauri:dev` cannot run over a headless SSH session.

**What it exercises:** everything. IPC round trips (zod-validated invoke),
the Rust error envelope, the log plugin, window transparency against the
compositor, and the shell layout at fullscreen resolution. This is the mode
the verification gate requires for any change that touches the shell surface
(ADR-0004: transparent behavior cannot be checked in a browser tab).

## Window characteristics

The window is configured in `src-tauri/tauri.conf.json`:

| Setting | Value | Consequence |
|---|---|---|
| `fullscreen` | `true` | The shell fills the monitor |
| `transparent` | `true` | The window has no background; the desktop composites through it |
| `decorations` | `false` | No title bar or window frame — Hyprland rules/gestures replace them |
| `shadow` | `false` | No client-side shadow |
| `hiddenTitle` | `true` | Title hidden on macOS-style title bars |
| `resizable` | `true` | Window can be resized (relevant outside fullscreen) |

### The transparency contract (ADR-0004)

The window is **transparent**, and the shell must stay that way:

- `html` and `body` keep `background: transparent` (`src/app.css`). The
  visual backdrop comes from glass panels — `backdrop-filter: blur(...)` over
  translucent surface tokens (`--dex-surface-*`) — never from an opaque
  body/window paint.
- **Never paint an opaque window background.** An opaque layer would hide the
  desktop and break the shell's whole visual identity. If you need a
  backdrop, use the glass tokens from `src/lib/ui/styles/tokens.css`.
- The graphics layer renders into a WebGL canvas created with `alpha: true`,
  composited **under** the DOM chrome, and also never paints an opaque
  backdrop (`src/lib/graphics/README.md`).

### Startup sequence

`src-tauri/tauri.conf.json` defines two windows:

- **splashscreen** — 420×280, transparent, undecorated, always-on-top, url
  `/splashscreen`.
- **main** — fullscreen, transparent, undecorated, hidden until ready.

On startup, the Rust `setup()` runs `database::init(<app_data_dir>/dex.db)`
and spawns `setup_backend`, which sleeps 2 s then calls
`set_complete("backend")`. The splash page runs its simulated frontend init
(≈2.5 s) then calls `set_complete("frontend")`. When **both** are complete,
the splash closes and the main window shows and focuses.

## Dev-mode CSP notes

`src-tauri/tauri.conf.json` sets a strict Content-Security-Policy:

```
default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src ipc: http://ipc.localhost
```

This is the shipped security baseline (ADR-0005): no remote scripts, no
remote connects, only the IPC channel and local resources.

In dev mode, Vite's HMR injects scripts and websocket connections that the
strict policy may block. If you see CSP violations in the webview console
while running `bun run tauri:dev`:

1. Loosen the policy **only in the dev configuration** — a per-environment
   dev override.
2. Re-run and confirm HMR works.
3. Never let the loosened policy reach a shipped build. The committed policy
   in `tauri.conf.json` is the release policy and must stay strict.

## Expected outcomes

- `bun run dev` prints the Vite dev-server banner with
  `http://localhost:1420` and keeps running. Opening it shows the HUD shell
  (top bar, viewport with grid, dock, status bar) with the default dark theme.
- `bun run tauri:dev` opens a borderless fullscreen window on the Hyprland
  session. The shell renders with glass panels over the desktop; the HMR
  overlay, if any, is the only visible Vite artifact.
- Ctrl-C stops either process. Stopping `bun run tauri:dev` also stops the
  Vite child process it started.

## Related Documents

- Build from source: [`Build.md`](Build.md)
- Debugging the frontend, Rust, and IPC: [`Debug.md`](Debug.md)
- Performance budgets and measurement: [`Profiling.md`](Profiling.md)
- Repository map and wiring rules: [`ProjectStructure.md`](ProjectStructure.md)
- Transparent compositing decision: [`../50-adr/0004-transparent-compositing.md`](../50-adr/0004-transparent-compositing.md)
- Security baseline (CSP, capabilities): [`../50-adr/0005-plugin-boundary.md`](../50-adr/0005-plugin-boundary.md)
- Design system (glass tokens, motion): [`../40-engineering/DesignSystem.md`](../40-engineering/DesignSystem.md)
- System architecture: [`../20-architecture/20_System_Architecture.md`](../20-architecture/20_System_Architecture.md)
- Canonical terminology: [`../00-vision/03_Glossary.md`](../00-vision/03_Glossary.md)