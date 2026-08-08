# DEX

**DEX** — a programmable desktop layer for Hyprland/Wayland on Arch Linux.
Not a desktop application: an operating layer between the user and the OS —
a reactive, modular, GPU-accelerated shell built on Tauri 2, Svelte 5, and
Rust.

## Stack

- Frontend: SvelteKit (SPA) · Svelte 5 runes · TypeScript strict · CSS
  variables · Three.js (Phase 2) · Bun
- Backend: Tauri 2 · Rust · Tokio · Serde · SQLite (rusqlite)
- Platform: Hyprland · Wayland · Arch Linux

## Architecture

Layer model, boundaries, and decisions live in
[`docs/20-architecture/20_System_Architecture.md`](docs/20-architecture/20_System_Architecture.md) and
[`docs/50-adr/`](docs/50-adr/) (ADR-0001 layer ownership, ADR-0002 typed IPC
contract, ADR-0003 design tokens, ADR-0004 transparent compositing).
Design system usage: [`docs/40-engineering/DesignSystem.md`](docs/40-engineering/DesignSystem.md).
Roadmap: [`docs/10-product/11_Product_Roadmap.md`](docs/10-product/11_Product_Roadmap.md).

Highlights:

- **Boundaries** — UI never touches SQLite, the shell, or the filesystem;
  Rust owns all system access. Every IPC call is schema-validated at both
  edges (zod ⇄ serde).
- **Feature-first** — business features are self-contained under
  `src/lib/features/<feature>/`; shared infrastructure in `src/lib/core/`;
  reusable visuals in `src/lib/ui/`; GPU in `src/lib/graphics/`.
- **Design tokens** — components consume semantic `var(--dex-*)` only;
  theming via `data-theme` with a typed TS palette mirror for the graphics
  engine.

## Development

```sh
bun install        # never npm
bun run dev        # Vite only, port 1420
bun run tauri:dev  # full desktop window (Wayland/Hyprland, webkit2gtk); manual desktop check
bun run verify     # authoritative gate: nine fail-fast checks (format, Rust format, lint,
                   # types, clippy, Rust types, tests, build, Rust tests); CI runs exactly this
bun run check      # svelte-check
cargo check        # inside src-tauri/
```

See [`AGENTS.md`](AGENTS.md) for repo mechanics and conventions.

## Status

Phase 0 (foundation): layer model, ADRs, design system, typed IPC layer,
theme store, Rust command scaffolding, and the M0.4 nine-gate verification
(`bun run verify`) + CI — no business features yet. See
[`docs/10-product/11_Product_Roadmap.md`](docs/10-product/11_Product_Roadmap.md).
