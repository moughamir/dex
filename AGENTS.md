# AGENTS.md

DEX — a programmable desktop layer for Hyprland. Phase 0 (foundation) is current; M0.1–M0.3 done, M0.4 (tooling/CI) open. Architecture decisions live in `docs/50-adr/` (read ADR-0001–0005 before touching cross-cutting code) and `docs/20-architecture/20_System_Architecture.md`. Detailed engineering rules live in `docs/40-engineering/` (CodingStandards, Testing, CI, GitWorkflow, Release). AGENTS.md is the operational ground truth for commands and repo mechanics.

## Stack

- SvelteKit 2 (Svelte 5 runes) + Vite 6 + TypeScript strict, Tauri 2 (Rust: tokio/serder/rusqlite/zbus), **Bun** package manager.
- SPA only: `adapter-static` + `index.html` fallback, `ssr = false` (`src/routes/+layout.ts`). No Node server.
- Frontend `src/` (Svelte); backend `src-tauri/` (Rust crate `omnizya_dex_lib` / bin `omnizya_dex`).

## Commands

- `bun install` — never `npm`/`pnpm`.
- `bun run dev` — Vite-only dev server, **port 1420** (`strictPort: true` in `vite.config.js`). Frontend work only; window chrome is not rendered here.
- `bun run check` (`check:watch` for watch mode) — `svelte-kit sync && svelte-check`. Frontend type gate; must pass clean.
- `bun run tauri dev` — full transparent desktop window. Requires Wayland/Hyprland + webkit2gtk + a display; **not headless, not in CI**.
- `cargo check` (then `cargo test`) inside `src-tauri/`.
- **No CI configured.** `tests/{unit,integration,e2e,frontend,backend}/` are empty, `.github/workflows/*.yml` are empty placeholders, and no JS test runner / lint / formatter is wired (M0.4). Verification runs locally.

## Live vs. placeholder

Phase 0 ships the shell + the IPC plumbing. The rest is scaffolding — much of it inert, not merely empty.

- **The only live IPC command is `greet`**, wired end-to-end: Rust `commands/core.rs` (`#[tauri::command] greet`) → single `generate_handler![commands::core::greet]` in `lib.rs` → TS contract `COMMANDS.greet` (`core/api/commands.ts`) → typed client `core/services/greet.ts`. Adding a command requires a contract in **both** `core/api/commands.ts` and `src-tauri/src/lib.rs`.
- **Live `core/` plumbing**: `core/api/{commands,tauri,events}.ts`, `core/services/greet.ts`, `core/utils/{logger,storage}.ts`, `core/stores/theme.svelte.ts` (bootstrapped in `+layout.svelte`), `core/config/{theme,layout,navigation}.ts`. (`core/stores/shell.svelte.ts` is real but currently not wired in.) Everything else under `core/{services,types,events,hooks,composables}` is an empty placeholder — do not import it.
- **Rust is mostly inert, not just empty.** `lib.rs` declares only `mod commands;` and `mod utils;`. The large `providers/` tree (dbus, modem, network, process, health, …), plus `state/`, `events/`, `ipc/`, `database/`, `models/`, `plugins/`, `services/`, `system/` — none are `mod`-declared, so **none are compiled**, even though several provider files contain real skeleton code. Don't build on them; declare a module only when its slice ships. (82 of 123 `*.rs` under `src-tauri/src/` are empty.)
- `database/migrations/*.sql`, `database/seeds/default.sql` and `database/dex.db` are empty/committed. **Migrations are append-only** (ADR-0001): never edit a committed migration; each schema change is a new migration + Rust model + zod schema in one slice.

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
- **Transparent window (ADR-0004)**: `tauri.conf.json` sets `fullscreen/transparent/decorations: false`. `html`/`body`/`#svelte`/`body` must stay `background: transparent` (app.css + `app.html` body) — visual backdrop comes from glass panels (`backdrop-filter` + translucent tokens). Any full-window solid fill is a contract violation.
- **Strict CSP (ADR-0005)** in `tauri.conf.json`: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src ipc: http://ipc.localhost`. Dev HMR (Vite ws) may need temporary relaxation — never ship the loosened policy.
- **Logging** — only `core/utils/logger.ts` (`logTrace`/`logDebug`/`logInfo`/`logWarn`/`logError`), a facade over `@tauri-apps/plugin-log` (writes stdout + app log dir), console fallback under plain `bun run dev`. No `console.*` in new code.
- **Svelte 5 runes only** (`$state`/`$derived`/`$effect`); stores are `.svelte.ts` files. No legacy `svelte/store`.
- **File naming**: `PascalCase.svelte` components; `kebab-case.svelte.ts` rune stores; `kebab-case.ts` modules; `snake_case.rs` Rust; zero-padded append-only migrations (`001_init.sql`).
- **Commits**: conventional (`feat:`/`fix:`/`refactor:`/`perf:`/`docs:`/`test:`/`style:`), imperative summary < 72 chars, body explains *why*. Branch from `develop` (`feat/`/`fix/`/… short-lived), **squash-merge** to `develop`; `develop` → `main` at milestone/release. `main`/`develop` are never force-pushed.

## Verification order (the gate)

1. `bun run check` — frontend types (`svelte-kit sync && svelte-check`).
2. `cargo check` — Rust, inside `src-tauri/`.
3. `bun run tauri dev` — manual desktop. Transparent/compositor behavior can't be tested headless (ADR-0004), so this stays a manual gate even after CI lands.

A change failing `bun run check` or `cargo check` is not ready for review. Automated suites (`cargo test`, bun test) slot in after M0.4; until then the manual desktop check covers behavior.
