# AGENTS.md

DEX — a programmable desktop layer for Hyprland. Product spec lives in the PRD; roadmap + milestones in `docs/roadmap.md` (10 phases / 34 milestones; Phase 0 foundation is current, M0.1–M0.3 done, M0.4 tooling/CI open). **Architecture decisions live in `docs/architecture.md` + `docs/adr/` — read ADR-0001/0002/0003/0004/0005 before touching cross-cutting code.**

## Stack

- SvelteKit 2 (Svelte 5 runes) + Vite + TypeScript strict, Tauri 2 (Rust), **Bun** package manager.
- SPA mode only: `adapter-static` with `index.html` fallback, `ssr = false` (`src/routes/+layout.ts`, `svelte.config.js`). Keep it — there is no Node server.
- Frontend/backend split: `src/` (Svelte) and `src-tauri/` (Rust crate `omnizya-dex`).

## Commands

- `bun install` — never `npm`.
- `bun run dev` — Vite only; serves on port **1420** (`strictPort` in `vite.config.js`).
- `bun run tauri dev` — full desktop window (requires Wayland/Hyprland, webkit2gtk; needs a display).
- `bun run check` — `svelte-kit sync && svelte-check`. Must pass clean.
- Rust: `cargo check` / `cargo test` inside `src-tauri/`. No JS test runner, lint, or formatter is configured yet (`tests/` is empty scaffolding) — Phase 0 M0.4.

## Repo state (important)

Phase 0 is mostly done (roadmap M0.1–M0.3): layer model, ADRs, design tokens, UI primitives, typed IPC layer, theme store, Rust command scaffolding, plugin-log wiring. Business features are NOT built yet.

- **Live UI is `src/lib/ui/layout/`**: `HUD.svelte`, `TopBar.svelte`, `Dock.svelte`, `StatusBar.svelte`. The root route (`src/routes/+page.svelte`) renders `$lib/ui/layout/HUD.svelte`. They consume the design tokens.
- **Design system**: tokens in `src/lib/ui/styles/tokens.css` (primitive → semantic layers; components use semantic `var(--dex-*)` only — no hardcoded colors), themes as TS palettes in `src/lib/ui/themes/` (mirror of the CSS for programmatic/GPU use), reusable primitives in `src/lib/ui/primitives/` (GlassPanel, Button, Icon, Tooltip, Divider).
- **IPC contract layer (ADR-0002)**: `src/lib/core/api/` = typed plumbing — `commands.ts` registry (rejects duplicate names), `tauri.ts` zod-validated invoke + closed error-code envelope, `events.ts` typed listen + `EVENTS` registry (`dex.<domain>.<event>` naming). `src/lib/core/services/` = one contract client per Rust command domain (mirrors `src-tauri/src/commands/`). Features must never import `@tauri-apps/api` directly — only `core/services`. The only live command today is `greet` (contract in `core/api/commands.ts`).
- **Error envelope (ADR-0002)**: Rust `AppError` (`src-tauri/src/utils/errors.rs`) serializes manually to exactly `{ "type", "message" }`; `type` is one of the closed set `validation`, `not_found`, `permission_denied`, `conflict`, `unsupported`, `internal`. `core/api/tauri.ts` validates rejections against it. Unit results are `z.null()`.
- **Logging**: `src/lib/core/utils/logger.ts` is the only logging import the frontend may use — facade over `@tauri-apps/plugin-log` (Rust plugin registered, `log:default` granted). No `console.*` in new code.
- **Theme state**: `src/lib/core/stores/theme.svelte.ts` (rune store, `data-theme` switching, persisted via `core/utils/storage.ts`). Bootstrapped in `src/routes/+layout.svelte`.
- **Graphics**: `src/lib/graphics/contracts.ts` = engine-agnostic renderer contracts; the Three.js implementation is Phase 2 (roadmap M2.x). Nothing outside `graphics/` touches WebGL/`three`.
- **Security baseline (ADR-0005)**: strict CSP set in `tauri.conf.json` (`default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src ipc: http://ipc.localhost`). Plugins are Rust-hosted, capability-gated, manifest-schema-validated. If dev-mode HMR complains about CSP, loosen only for dev — never ship the loosened policy.
- Most of `src/lib/features/**`, `src/lib/core/{services,types,config,utils}/*`, and `src-tauri/src/**` beyond the above are **~154 0-byte placeholders** mirroring the PRD. Don't assume any of it works or import it. Undeclared Rust modules are not compiled — don't `mod` a 0-byte file.
- `database/migrations/*.sql` and `database/seeds/default.sql` are empty; `database/dex.db` is an empty committed file. **Migrations are append-only** (ADR-0001): never edit a committed migration; each schema change is a new migration + Rust model + zod schema in one slice. `scripts/*.ts`, `docs/{api,database,plugin-sdk}.md`, `.github/workflows/*.yml` are empty placeholders. No CI is configured.
- `.env.example` is empty; Tauri config has no env requirements.

## How new code is wired

- **IPC commands (the 5-step checklist, ADR-0002)**:
  1. Rust: `src-tauri/src/commands/<domain>.rs` — `#[tauri::command]`, `Result<T, AppError>` (from `src-tauri/src/utils/errors.rs`), **exactly one serde struct arg** — no `#[serde(rename_all = ...)]`; serde defaults (snake_case) are the wire authority.
  2. Rust: declare the module + **append the fn to the single `generate_handler![...]`** in `src-tauri/src/lib.rs` — exactly one `invoke_handler` call may exist; a second call silently shadows the first.
  3. TS: add a `defineCommand(...)` contract + schemas to `src/lib/core/api/commands.ts` (duplicate names are rejected). Infallible commands use `z.null()`.
  4. TS: expose a typed async fn in `src/lib/core/services/<domain>.ts` (returns the domain's typed result, surfaces `IpcError` on failure).
  5. Capability grant if a plugin is involved (`src-tauri/capabilities/default.json`; `log:default` already granted).
- **Frontend never touches the filesystem/SQLite/shell** (PRD security rule; ADR-0001). All system access goes through `core/services` → Rust. Don't reach for Node/`fetch` to local resources.
- **Events (Rust→UI)**: emit from `src-tauri/src/events/`, declare the name in the `EVENTS` registry (`dex.<domain>.<event>`) and subscribe with `onEvent(name, schema, handler)` from `core/api/events.ts`. Invalid payloads are logged and dropped.
- **Features never import other features** (ADR-0001): shared logic moves to `core/` or `ui/`, never cross-feature imports.

## Conventions

- Feature-first: new features live in `src/lib/features/<feature>/{components,services,stores,types,utils}` (business logic only); shared infra in `src/lib/core/`; reusable visuals in `src/lib/ui/`; GPU in `src/lib/graphics/`.
- Svelte 5 runes (`$state`, `$derived`, `$effect`); stores are `.svelte.ts` files. No legacy `svelte/store` imports.
- Tauri window is fullscreen, transparent, undecorated (`tauri.conf.json`). **Never paint an opaque window background** (ADR-0004): `html`/`body` stay transparent; visual backdrop comes from glass panels (`backdrop-filter` + translucent surface tokens).
- Design tokens, not magic values: colors/radii/durations/z-index come from `tokens.css`/themes. Motion: 150–250 ms, `cubic-bezier(.22,.61,.36,1)`, only `transform`/`opacity` (60 FPS contract).
- Conventional commits (`feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `test:`, `style:`).
- TypeScript strict, no `any`, no magic strings/numbers (PRD rules).
- New dependencies require justification; prefer platform features and existing deps (`zod`, `cva`, `clsx`).

## Verification order

1. `bun run check` (frontend types)
2. `cargo check` in `src-tauri/` (Rust)
3. `bun run tauri dev` (manual, desktop only)
