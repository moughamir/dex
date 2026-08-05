# ADR-0001: Layer Model and Folder Ownership

- Status: Accepted
- Date: 2026-08-04
- Deciders: Principal Architect (technical co-founder)
- Scope: Repository-wide structural foundation for DEX (target > 100,000 LOC)

## Context

DEX is an operating layer between the user and the OS, not a web application.
Phase 0 must fix the boundaries every future feature builds on. The scaffold
already mirrors the PRD with 0-byte scaffolding files on both sides
(`src/lib/**` and `src-tauri/src/**`), which is structurally sound but has
several inconsistencies that would rot at scale:

1. `src/lib/core/database/` places a SQLite access layer in the frontend —
   a direct violation of the boundary rule "SQLite is accessed only by Rust".
2. Three folders host the same concept (reactive helper logic):
   `src/lib/composables/`, `src/lib/core/hooks/`, `src/lib/animations/`.
3. `src/lib/core/services/` holds per-domain IPC client modules whose role was
   never documented, and `src/lib/features/*/services/` also exists — two
   service homes with no stated rule.
4. `src/lib/ui/components/` is a stale, broken duplicate of the live
   `src/lib/ui/layout/` tree (it fails `bun run check`).

## Decision

### Layer model

```
┌──────────────────────────────────────────────┐
│ ui/          presentation, reusable visuals   │
│ features/    business features (own their     │
│              components/stores/services/      │
│              types/utils)                     │
│ core/        infrastructure only              │
│   api/         generic typed IPC plumbing     │
│   services/    IPC contract clients           │
│   stores/      cross-cutting rune state       │
│   composables/ reactive helper logic          │
│   utils/       pure helpers                   │
│   config/      constants and app config       │
│   types/       shared domain models           │
│ graphics/    rendering engine contracts +     │
│              future Three.js implementation   │
└───────────────┬───────────────────────────────┘
                │ typed services only (zod-validated)
┌───────────────┴───────────────────────────────┐
│ Tauri IPC (invoke / events)                   │
└───────────────┬───────────────────────────────┘
                │ serde-typed command handlers
┌───────────────┴───────────────────────────────┐
│ src-tauri/    native system implementation     │
│   commands/     #[tauri::command] handlers     │
│   services/     domain logic (Rust)            │
│   system/       OS access (Hyprland, Wayland)  │
│   database/     SQLite access                  │
│   models/       serde wire models              │
│   events/       event emission                 │
│   config/       app configuration              │
│   state/        managed Tauri state            │
└───────────────┬───────────────────────────────┘
                │ rusqlite (Rust-owned, single writer)
┌───────────────┴───────────────────────────────┐
│ database/     SQL schema + migrations (truth)  │
└────────────────────────────────────────────────┘
```

### Rules

- **Dependency direction is one-way and acyclic**: `ui` → `features` → `core`
  → IPC → `src-tauri`. `graphics` is consumed by `ui`/`features` and never
  imports business logic. `core` never imports `features` or `ui`.
- **UI never accesses SQLite, executes shell commands, or touches the
  filesystem.** All system access flows through typed services → Tauri IPC →
  Rust.
- **`core/services/` is the IPC contract layer**: exactly one contract client
  module per Rust command domain (`src-tauri/src/commands/<domain>.rs` ↔
  `src/lib/core/services/<domain>.ts`). Features consume contract clients;
  they never call `@tauri-apps/api` directly. See ADR-0002.
- **`features/<feature>/services/` holds feature business logic** that
  composes contract clients and feature state — not raw IPC calls.
- **Features never import other features.** Shared logic moves to `core/`
  (infrastructure) or `ui/` (reusable visuals), never cross-feature imports —
  keeps the feature graph acyclic and individually testable.
- **Migrations are append-only.** A committed `database/migrations/*.sql`
  file is never edited; every schema change is a new migration + Rust model +
  zod schema in one slice. SQLite integers arrive as i64/u64 — values beyond
  2^53 lose precision in JS, so keep IDs and small ints in range or serialize
  them as strings.

### Consolidations

| Action | Rationale |
|---|---|
| Delete `src/lib/ui/components/` | Stale broken duplicate of `ui/layout/`; breaks the build (AGENTS.md) |
| Delete `src/lib/core/database/` | SQLite access lives in Rust only; schema truth lives in top-level `database/` |
| Move `src/lib/composables/*`, `src/lib/core/hooks/*`, `src/lib/animations/*` → `src/lib/core/composables/` | One canonical home for reactive helper logic, under infrastructure |
| Delete `create-hud.sh` | Writes to a non-existent path (`src/lib/layout/`); stale and dangerous |
| `core/services/` = contract layer (documented above) | Removes ambiguity with `features/*/services/` |

## Consequences

- New features follow: `features/<feature>/{components,services,stores,types,utils}`
  containing business logic only; all OS interaction via `core/services`.
- New command domains add one Rust module (`src-tauri/src/commands/`),
  register it in `src-tauri/src/lib.rs`, and add one contract client in
  `core/services/`.
- Verification of boundary compliance is a review checklist item:
  no `@tauri-apps/api` imports outside `core/`, no `fetch`/`fs` in frontend,
  no SQL in frontend.
- The 0-byte PRD-mirror scaffolding outside these rules stays undeclared and
  unreferenced until their owning phase; they are structure, not code.
