# DEX Coding Standards

## Purpose

This document is the canonical engineering standard for writing code in the
DEX repository. It exists because DEX crosses a language boundary — TypeScript
and Rust — at every IPC call, and because the repository is designed to hold
past 100,000 lines of code. At that scale, consistency is not a style
preference; it is what keeps the codebase navigable, reviewable, and safe to
change.

The rules here are binding. They are the concrete form of the Principles
(`02_Principles.md`) and the layer model (ADR-0001). Where this document and
AGENTS.md both state a rule, they agree; AGENTS.md is the operational ground
truth for commands and repo mechanics, and this document is the reasoning and
the detail behind the coding rules.

This standard covers the frontend (Svelte 5 + TypeScript) and the Rust crate
(`src-tauri/`). It does not re-state the design-token or motion rules — those
live in `DesignSystem.md`. It does not re-state the IPC contract mechanics —
those live in ADR-0002.

## Why these rules exist

Every rule below traces to a failure mode DEX is designed to avoid:

- **Strong Typing (Principle 8).** The UI and the Runtime are different
  languages. A seam without a typed contract rots silently. Strict TypeScript
  and schema-validated IPC are the same rule applied at two scales.
- **Feature First Architecture (Principle 10).** The repository must mirror
  the product so a new engineer finds the feature they are asked to change.
  Feature-first layout is that rule made concrete.
- **Lightweight Core (Principle 7).** Every dependency carried in the core is
  carried forever. Dependency discipline is the cost of keeping the core
  small.
- **Native First (Principle 5).** Performance and Linux integration come
  first. No-magic-values and token-governed styling are what keep the shell
  compositor-safe and themeable.

## Language and type discipline

### TypeScript is strict

The `tsconfig.json` runs in strict mode. This is not negotiable and is not
relaxed per-file. Strict mode is the frontend half of Strong Typing: it turns
a class of runtime failures into editor errors.

- **No `any`.** If a value is genuinely unknown, type it as `unknown` and
  narrow it with a type guard or a zod schema. `any` disables the compiler at
  exactly the boundary where it is most needed.
- **No `@ts-ignore`.** If a line does not type-check, fix the type. A
  suppression hides a real contract problem.
- **No untyped IPC.** Features never call `@tauri-apps/api` directly; they
  call typed contract clients in `core/services/` (ADR-0002). The only place
  `@tauri-apps/api` may be imported is `core/api/`.

### No magic values

A magic value is a literal whose meaning is not self-evident and that is not
governed by a named constant or token. DEX forbids them in both languages.

- **Colors, radii, durations, z-index, spacing** come from the design tokens
  (`--dex-*`) — see `DesignSystem.md`. Never hardcode a hex or `rgba` value in
  a component.
- **Domain constants** (event names, storage keys, command names, error codes)
  live in named constants or registries. The IPC command names live in
  `core/api/commands.ts`; event names live in the `EVENTS` registry in
  `core/api/events.ts`; the closed error-code set lives in
  `src-tauri/src/utils/errors.rs` and its zod mirror in `core/api/tauri.ts`.
- **Repeated literals** are promoted to a constant in `core/config/` or the
  nearest owning module. If a value would be needed twice more, it is a
  constant now.

### Rust

- The crate compiles under the default `cargo check` with no warnings treated
  as acceptable. Clippy runs as step 5 of `bun run verify`
  (`cargo:clippy --all-targets --all-features -D warnings`).
- Serde wire models use serde defaults (snake_case). No
  `#[serde(rename_all = ...)]` on command args or results — ADR-0002.
- `AppError` is the only error type surfaced across IPC; its `Serialize` impl
  is hand-written and must never be replaced with a derived impl (ADR-0002).

## Svelte 5 runes only

Svelte 5 runes are the state mechanism. The legacy `svelte/store` API
(`writable`, `readable`, `derived`) is forbidden.

- State is declared with `$state`, derived values with `$derived`, and
  side effects with `$effect`.
- Stores are `.svelte.ts` files. Cross-cutting state lives in
  `core/stores/`; feature state lives in `features/<feature>/stores/`.
- Rune stores are module singletons by convention (the Svelte 5 idiom). The
  `theme.svelte.ts` store is the reference pattern: module state is not
  exported directly (Svelte rejects `state_invalid_export`); it is exposed
  through getter functions so reads stay reactive inside `$derived`/`$effect`.
- Logic that needs injection accepts dependencies explicitly rather than
  reaching for globals. No globals beyond rune state.

## Logging

The frontend logs only through the facade in `core/utils/logger.ts`
(`logTrace`, `logDebug`, `logInfo`, `logWarn`, `logError`). This facade wraps
`@tauri-apps/plugin-log` (the Rust plugin writes to stdout and the app log
dir) and falls back to the browser console when running outside Tauri.

- **No `console.*` in new code.** The facade exists so log output is
  consistent and so the frontend never depends on the browser console.
- Log at the level that matches the event. Do not log sensitive data —
  secrets and knowledge stay local (Offline First, Principle 2).
- The Rust side logs through `src-tauri/src/utils/logger.rs`.

## Feature-first layout and dependency rules

The repository is organized around product features (ADR-0001). The dependency
direction is one-way and acyclic:

```
ui → features → core → IPC → src-tauri
```

- **Features never import other features.** Shared logic moves to `core/`
  (infrastructure) or `ui/` (reusable visuals). A cross-feature import breaks
  the acyclic graph and couples two vertical slices.
- **`core` never imports `features` or `ui`.** Infrastructure is independent
  of the product.
- **`graphics` is consumed by `ui`/`features`; it never imports business
  logic.**
- **Features own their business logic** under
  `features/<feature>/{components,services,stores,types,utils}`. Feature
  `services/` composes contract clients and feature state; it never makes raw
  IPC calls.
- **The frontend never touches the filesystem, SQLite, or the shell.** All
  system access flows through `core/services` → IPC → Rust (ADR-0001). No
  `fetch` to local resources, no `fs`, no SQL in the frontend.

### The IPC wiring checklist

Adding a command follows the five-step checklist in AGENTS.md and ADR-0002.
The wire contract for any command lives in exactly two places:
`core/api/commands.ts` (registry entry) and `src-tauri/src/lib.rs`
(`invoke_handler`). A command not in both is not callable. There is exactly
one `invoke_handler` call; a second silently shadows the first.

## Design tokens, not hardcoded values

Components consume semantic tokens (`--dex-*`) for every color and typography
decision, and the scale tokens for spacing, radii, durations, z-index, and
blur. The full rule and the token reference are in `DesignSystem.md`. The
coding-standard consequence is simple: **a component that contains a literal
color, radius, duration, or z-index is wrong.** When a semantic value changes
in `tokens.css`, update the matching palette in `ui/themes/` (ADR-0003).

## Component size limits

A component is a unit of presentation. When it grows past the point where one
person can hold it in their head, it stops being composable.

- **Components stay under 300 lines.** A component that exceeds this is a
  signal to extract a child component or a composable.
- **Functions are focused and pure where possible.** A function that does one
  thing is testable; a function that does five is not.
- **Composition over inheritance (Principle 9).** Reuse by composing small
  pieces, never by subclassing into a hierarchy.
- **No duplicated logic.** If a pattern would be needed twice more, promote it
  to `core/` or `ui/primitives/` — never copy-paste it (ADR-0001).
- **No unnecessary abstractions.** A layer of indirection with one caller is
  not an abstraction; it is a detour.

## Dependency policy

New dependencies require justification. Every dependency is carried in every
build, on every user, forever (Lightweight Core, Principle 7).

- **Prefer platform features and existing dependencies.** The approved set is
  `zod` (schema validation), `cva` + `clsx` (variant styling), the Tauri
  plugins already granted, and `@floating-ui/dom` — approved **for popover
  positioning only** (ContextMenu, Dropdown; D1, ADR-0007). Do not add icon
  libraries, other positioning libraries or floating-ui alternatives (e.g.
  `bits-ui`), utility frameworks, or any new npm dependency.
- **A new dependency must be justified in the PR** with the problem it solves
  and why the existing set cannot solve it. A dependency added "because it is
  convenient" is rejected.
- **Frontend dependencies are minimized** because the shell ships a strict CSP
  (ADR-0005) and a small core. Rust dependencies are minimized for the same
  reason.

## Conventional commits

Every commit uses the conventional-commits format. The allowed types are
`feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `test:`, `style:`. The full
workflow — branch model, commit hygiene, review — is in `GitWorkflow.md`.

## File naming conventions

- **Svelte components** are `PascalCase.svelte` (`Button.svelte`,
  `GlassPanel.svelte`).
- **Rune stores** are `kebab-case.svelte.ts` (`theme.svelte.ts`,
  `notification.svelte.ts`).
- **Plain TypeScript modules** are `kebab-case.ts` (`commands.ts`,
  `logger.ts`, `tokens.css`).
- **Rust modules** are `snake_case.rs` (`errors.rs`, `app_state.rs`).
- **SQL migrations** are zero-padded, append-only, and never edited after
  commit (`001_init.sql`, `002_settings.sql`). Each schema change is a new
  migration + Rust model + zod schema in one slice (ADR-0001).

## Verification (the gate)

Run `bun run verify` (`scripts/verify.ts`) from any cwd before merging. It runs nine gates in order, fail-fast:

1. `format:check` — frontend formatting (`prettier --check src/`)
2. `cargo:fmt:check` — backend formatting (`cargo fmt --check`, `--manifest-path`)
3. `lint` — frontend lint (`eslint src/`)
4. `check` — frontend types (`svelte-kit sync && svelte-check`)
5. `cargo:clippy` — backend lint (`clippy --all-targets --all-features -D warnings`)
6. `cargo:check` — backend types
7. `test` — frontend tests (`vitest run`)
8. `build` — frontend production build (`vite build`)
9. `cargo:test` — backend tests

CI runs exactly this gate on push/PR to `develop`/`main`. The individual `bun run check` and `bun run cargo:check` remain valid single-gate checks during development; `bun run tauri:dev` stays a manual desktop gate (transparent/compositor behavior cannot be tested headless, ADR-0004). A change failing any gate is not ready for review.

## Related Documents

- Canonical terminology: [`../00-vision/03_Glossary.md`](../00-vision/03_Glossary.md)
- The twelve values: [`../00-vision/02_Principles.md`](../00-vision/02_Principles.md)
- Layer model and folder ownership: [`../50-adr/0001-layer-ownership.md`](../50-adr/0001-layer-ownership.md)
- Typed IPC contract: [`../50-adr/0002-typed-ipc-contract.md`](../50-adr/0002-typed-ipc-contract.md)
- Design tokens: [`../50-adr/0003-design-tokens.md`](../50-adr/0003-design-tokens.md)
- Overlay primitives (portals, floating positioning, translucent backdrops):
  [`../50-adr/0007-overlay-primitives.md`](../50-adr/0007-overlay-primitives.md)
- System architecture: [`../20-architecture/20_System_Architecture.md`](../20-architecture/20_System_Architecture.md)
- Design system (tokens, motion, primitives): [`DesignSystem.md`](DesignSystem.md)
- Git workflow: [`GitWorkflow.md`](GitWorkflow.md)
- Testing strategy: [`Testing.md`](Testing.md)
- Performance standards: [`Performance.md`](Performance.md)