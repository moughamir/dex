# AGENTS.md

DEX — a programmable desktop layer for Hyprland. Phase 0 (foundation) is current; M0.1–M0.4 done (tooling/CI landed in M0.4). Architecture decisions live in `docs/50-adr/` (read ADR-0001–0005 before touching cross-cutting code) and `docs/20-architecture/20_System_Architecture.md`. Detailed engineering rules live in `docs/40-engineering/` (CodingStandards, Testing, CI, GitWorkflow, Release). AGENTS.md is the operational ground truth for commands and repo mechanics.

## Stack

- SvelteKit 2 (Svelte 5 runes) + Vite 6 + TypeScript strict, Tauri 2 (Rust: tokio/serde/rusqlite/zbus), **Bun** package manager.
- SPA only: `adapter-static` + `index.html` fallback, `ssr = false` (`src/routes/+layout.ts`). No Node server.
- Frontend `src/` (Svelte); backend `src-tauri/` (Rust crate `omnizya_dex_lib` / bin `omnizya_dex`).

## Commands

- `bun install` — never `npm`/`pnpm`.
- `bun run dev` — Vite-only dev server, **port 1420** (`strictPort: true` in `vite.config.js`). Frontend work only; window chrome is not rendered here.
- `bun run verify` — **the authoritative M0.4 gate** (`scripts/verify.ts`, run from any cwd). Nine steps, fail-fast, in order: `format:check` → `cargo:fmt:check` → `lint` → `check` → `cargo:clippy` → `cargo:check` → `test` → `build` → `cargo:test`. CI runs exactly this. Run before any merge.
- `bun run check` (`check:watch`) — `svelte-kit sync && svelte-check`. Frontend type gate; must pass clean.
- `bun run lint` — `eslint src/`. `bun run format:check` / `format:write` — `prettier --check src/` / `--write`.
- `bun run test` — `vitest run` (frontend, `tests/frontend/`, node env, `$lib` + lucide-svelte stubs via `vitest.config.ts`).
- `bun run cargo:check` / `cargo:test` / `cargo:build` / `cargo:fmt:check` / `cargo:clippy` — Rust toolchain tasks mapped via package scripts (all `--manifest-path`, cwd-independent).
- `bun run gate` — legacy alias for `bun run check && bun run cargo:check`; prefer `bun run verify`.
- `bun run tauri:dev` (`tauri:build`) — full transparent desktop window dev/build via Bun. Requires Wayland/Hyprland + webkit2gtk + a display; **not headless, not in CI**.
- **CI is wired**: `.github/workflows/ci.yml` runs `bun run verify` on push/PR to `develop`/`main`. No release pipeline yet (M0.4 deliberately ships the verify gate only).

## Live vs. placeholder

Phase 0 ships the shell + the IPC plumbing. The rest is scaffolding — much of it inert, not merely empty.

- **IPC wiring**: the Rust `invoke_handler` registers two commands — `commands::core::greet` (Rust-only; no TS contract) and `commands::core::set_complete` (both edges; the splash screen calls it via `COMMANDS.setComplete`). The TS `COMMANDS` registry (`core/api/commands.ts`) is broader: it forward-declares **25** contracts (`system_snapshot`, `process_list`, `history_list`, …) with zod schemas, plus typed contract clients in `core/services/`. Those Rust handlers do not exist yet — `commands/mod.rs` declares only `core`. Do not treat the forward contracts as live; a command is callable only when it is in **both** `COMMANDS` and the `generate_handler!` (ADR-0002).
- **Live `core/` plumbing**: `core/api/{commands,tauri,events}.ts`, `core/services/{system,network,process,modem,settings,widgets,terminal,plugins,history}.ts`, `core/utils/{logger,storage,date,format,helpers}.ts`, `core/stores/theme.svelte.ts` (bootstrapped in `+layout.svelte`), `core/config/{theme,layout,navigation}.ts`, and the `core/types/*` wire types. (`core/stores/shell.svelte.ts` is real and wired in `+layout.svelte`.) Everything else under `core/{services,types,events,hooks,composables}` is an empty placeholder — do not import it.
- **Live `graphics/` subsystem (M2.1/M2.2, ADR-0008)**: `src/lib/graphics/{contracts,renderer,scene,camera,lighting}.ts`, `src/lib/graphics/effects/{manager,fog,background,grid,particles,color}.ts`, `src/lib/graphics/shaders/background.glsl.ts` and `src/lib/ui/effects/GraphicsBackdrop.svelte` (mounted in `AppShell.svelte`). Three.js (`three@^0.185.1`) is a dependency of `graphics/` only. Placeholders not yet implemented: `graphics/controls.ts` plus the empty `graphics/{objects,materials,core}/` directories.
- **Rust is mixed: `providers/` and `database/` are compiled and tested; the rest is inert.** `lib.rs` declares `mod commands; mod database; pub mod providers; mod utils;`. Compiled today: `commands::core`, `database::{connection, migrations}`, `providers/{capability, dbus, error, health, modem, network, process, provider, registry, state}`, `utils/{errors, logger}` — 67 unit tests pass (network/process providers, capability, migrations, errors). `models/` is **not** `mod`-declared, so it is not compiled (don't build on it); `ai/`, `ipc/`, `plugins/`, `services/`, `state/`, `system/`, `config/`, `commands/{ai,database,hyprland,plugins,settings,system,terminal,widgets}.rs` and `database/{queries,repository,schema}.rs` are empty/inert placeholders. (35 of 96 `*.rs` under `src-tauri/src/` are empty.) Declare a module only when its slice ships.
- `database/migrations/*.sql` are real, committed, **append-only** (ADR-0001): only `001_init.sql` is registered and applied by `database/migrations.rs` (schema_version + WAL); `002_settings`/`003_widgets`/`004_plugins` exist on disk but are **not** registered; `005_history.sql` is empty (0 bytes). Never edit a committed migration; each schema change is a new migration + Rust model + zod schema in one slice. `database/seeds/default.sql` and `database/dex.db` are empty/committed.

## How new code is wired (ADR-0002 IPC checklist)

1. Rust `src-tauri/src/commands/<domain>.rs` — `#[tauri::command]`, `Result<T, AppError>` (from `utils/errors.rs`), **exactly one serde struct arg**; no `#[serde(rename_all)]`, serde snake_case is the wire authority.
2. Rust: declare the module in `commands/mod.rs` and append the fn to the **single** `generate_handler![...]` in `lib.rs` — exactly one `invoke_handler`; a second silently shadows the first.
3. TS: add `defineCommand(...)` + zod schemas to `core/api/commands.ts` (duplicate names throw at import). Infallible commands use `z.null()`.
4. TS: expose a typed async fn in `core/services/<domain>.ts` returning the domain result, surfacing `IpcError` on failure.
5. Capability grant if a plugin is involved (`src-tauri/capabilities/default.json`; `log:default` already granted).
- Rust→UI events: emit from `src-tauri/src/events/` (future phase), declare in the `EVENTS` registry (`dex.<domain>.<event>`) and subscribe via `onEvent(name, schema, handler)` from `core/api/events.ts`. Invalid payloads are logged and dropped, never thrown into the handler.

## Conventions

- **Boundaries** — frontend never imports `@tauri-apps/api` directly (only `core/api`); features only call typed clients in `core/services`. No `fetch`/`fs`/SQLite in the frontend — all system access flows `core/services` → Rust (ADR-0001). Features never import other features; shared logic goes to `core/` or `ui/`. Depend direction is acyclic: `ui → features → core → IPC → src-tauri`.
- **Design tokens** — defined in `src/lib/ui/styles/tokens.css` (the live source). Components consume semantic tokens via `var(...)`, never hardcoded color/radius/duration/z-index literals.
  - Token namespaces: `--surface-*`, `--bg-*`, `--text-*`, `--glass-*`, `--blur-*`, `--radius-*`, `--space-*`, `--shadow-*`, `--duration-*`, `--ease-*`, `--z-*`, plus `--dex-*` for brand/accent only (e.g. `var(--text-muted)`, `var(--surface-3)`, `var(--dex-primary)`). `docs/40-engineering/DesignSystem.md` describes an aspirational flat `--dex-*` vocabulary that does **not** match the imported `tokens.css`; follow the CSS file.
  - Themes are TS palettes in `src/lib/ui/themes/` (light/dark/cyber), mirrored to `data-theme`; `theme.svelte.ts` + `init()` bootstrapped in `src/routes/+layout.svelte`.
- **Tailwind v4** is wired config-less via `@tailwindcss/vite` — there is **no** `tailwind.config.js`/`postcss.config.js`. Utility classes and arbitrary properties (`bg-(--surface-3)`) both resolve to CSS vars.
- **Transparent window (ADR-0004)**: `tauri.conf.json` defines two windows — `splashscreen` (420×280, transparent, undecorated, always-on-top, url `/splashscreen`) and `main` (800×600, **fullscreen: true**, transparent, decorations: false, shadow: false, hiddenTitle, visible: false). `html`/`body`/`#svelte`/`body` must stay `background: transparent` (app.css + `app.html` body) — visual backdrop comes from glass panels (`backdrop-filter` + translucent tokens). Any full-window solid fill is a contract violation.
- **Strict CSP (ADR-0005)** in `tauri.conf.json`: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src ipc: http://ipc.localhost`. Dev HMR (Vite ws) may need temporary relaxation — never ship the loosened policy.
- **Logging** — only `core/utils/logger.ts` (`logTrace`/`logDebug`/`logInfo`/`logWarn`/`logError`), a facade over `@tauri-apps/plugin-log` (writes stdout + app log dir), console fallback under plain `bun run dev`. No `console.*` in new code.
- **Svelte 5 runes only** (`$state`/`$derived`/`$effect`); stores are `.svelte.ts` files. No legacy `svelte/store`.
- **File naming**: `PascalCase.svelte` components; `kebab-case.svelte.ts` rune stores; `kebab-case.ts` modules; `snake_case.rs` Rust; zero-padded append-only migrations (`001_init.sql`).
- **Commits**: conventional (`feat:`/`fix:`/`refactor:`/`perf:`/`docs:`/`test:`/`style:`), imperative summary < 72 chars, body explains *why*. Branch from `develop` (`feat/`/`fix/`/… short-lived), **squash-merge** to `develop`; `develop` → `main` at milestone/release. `main`/`develop` are never force-pushed.

## Verification order (the gate)

Run `bun run verify` (`scripts/verify.ts`) from any cwd before merging. It runs all nine gates in order, fail-fast:

1. `format:check` — frontend formatting (`prettier --check src/`).
2. `cargo:fmt:check` — backend formatting (`cargo fmt --check`, `--manifest-path`).
3. `lint` — frontend lint (`eslint src/`).
4. `check` — frontend types (`svelte-kit sync && svelte-check`).
5. `cargo:clippy` — backend lint (`clippy --all-targets --all-features -D warnings`).
6. `cargo:check` — backend types.
7. `test` — frontend tests (`vitest run`).
8. `build` — frontend production build (`vite build`).
9. `cargo:test` — backend tests.

The individual `bun run check` / `cargo:check` remain valid single-gate checks during development. After CI lands, `bun run tauri:dev` stays a manual desktop gate: transparent/compositor behavior can't be tested headless (ADR-0004).

A change failing any gate is not ready for review.
