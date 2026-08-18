# M0.4 Verification Baseline

> **Superseded (2026-08-08).** This file is a *historical* baseline recording
> the verification state while M0.4 (Development Tooling, CI) was still open.
> M0.4 has since shipped: the authoritative gate is now `bun run verify` —
> nine steps, fail-fast, run by CI on push/PR to `develop`/`main` (see
> `AGENTS.md` and [`CI.md`](CI.md)). The pass/fail tables below describe the
> pre-ship state and are kept as the dated record; do not treat them as
> current.

**Status:** Phase 0 (foundation). M0.4 (Development Tooling, CI) is open.
**Date:** 2026-08-07
**Scope:** Records the current authoritative verification commands and their pass/fail state. Does **not** change application code; no tooling is added in this step.

## 1. Repository layout (relevant to verification)

| Artifact | Path | Notes |
|---|---|---|
| Frontend package config | `package.json` (root) | Scripts live here. |
| Rust crate | `src-tauri/Cargo.toml` | **This is the only `Cargo.toml`.** There is no root-level workspace manifest. |
| Tauri config | `src-tauri/tauri.conf.json` | `beforeDevCommand: bun run dev`, `beforeBuildCommand: bun run build`, `frontendDist: ../build`. |
| SvelteKit config | `svelte.config.js` (root) | `adapter-static` with `index.html` fallback (SPA mode), `ssr = false`. |
| Vite config | `vite.config.js` (root) | `strictPort: true`, port 1420. |
| ESLint config | `eslint.config.js` (root) | Flat config, TS + Svelte + Prettier. |
| Prettier config | `.prettierrc` (root) | Svelte plugin enabled. |
| Vitest config | `vitest.config.ts` (root) | Includes `tests/frontend/**/*.test.ts`. |
| GitHub workflows | `.github/workflows/ci.yml`, `.github/workflows/release.yml` | Both are **populated** (not empty — see §4). |
| Test dirs | `tests/{frontend,backend,unit,integration,e2e}/` | `tests/frontend/` has a stub + one real test; the rest hold `.gitkeep`. |
| Rust scripts | `scripts/{build,check,lint,release,migrate,seed,clean}.ts` | **Empty scaffolding** — not wired into any pipeline. |

## 2. Canonical verification commands

There is no root-level `Cargo.toml`. The Rust toolchain must therefore be pointed
at the crate manifest explicitly. Two equivalent forms exist; both are valid:

```
# From repository root (no cd):
cargo <subcommand> --manifest-path ./src-tauri/Cargo.toml [args...]

# From inside the crate dir:
cd src-tauri && cargo <subcommand> [args...]
```

The `package.json` `cargo:check` script already uses the `--manifest-path` form:
```
"cargo:check": "cargo check --manifest-path ./src-tauri/Cargo.toml"
```

This is the single source of truth for the local Rust path ambiguity. All other
Rust commands (clippy, test, fmt) must follow the same pattern.

### Full verification order

| # | Command | Layer | Required to pass |
|---|---|---|---|
| 1 | `bun install` | deps | ✅ |
| 2 | `bun run check` | Frontend types | ✅ |
| 3 | `cargo check --manifest-path ./src-tauri/Cargo.toml` | Rust types | ✅ |
| 4 | `cargo clippy --manifest-path ./src-tauri/Cargo.toml --all-targets --all-features` | Rust lint | ⚠️ (warnings; see §3.2) |
| 5 | `cargo fmt --manifest-path ./src-tauri/Cargo.toml --check` | Rust format | ✅ |
| 6 | `bun run lint` | Frontend lint (ESLint) | ✅ |
| 7 | `bun run format:check` | Frontend format (Prettier) | ❌ (see §3.3) |
| 8 | `bun run test` | Frontend tests (Vitest) | ✅ |
| 9 | `cargo test --manifest-path ./src-tauri/Cargo.toml` | Rust tests | ✅ (compiles, 0 tests) |
| 10 | `bun run build` | Build (vite build) | ✅ |
| 11 | `bun run tauri dev` | Desktop (manual) | ✅ when run on Wayland |

**Order rationale (per `docs/40-engineering/Testing.md` §Verification order):**
type checks first (frontend, then Rust), then lint/format/tests, then build,
then the manual desktop check. The desktop check is a manual gate because the
transparent compositor window (ADR-0004) cannot be exercised headless.

## 3. Current pass/fail state

### 3.1 Commands that pass

| Command | Result |
|---|---|
| `bun install` | Pass |
| `bun run check` | 0 errors, 0 warnings |
| `cargo check --manifest-path ./src-tauri/Cargo.toml` | Pass — **9 warnings** (dead-code in `src/utils/logger.rs`; see §3.2) |
| `cargo fmt --manifest-path ./src-tauri/Cargo.toml --check` | Pass (clean) |
| `bun run lint` | Pass (0 errors) |
| `bun run test` | Pass — 1 file, 8 tests |
| `cargo test --manifest-path ./src-tauri/Cargo.toml` | Pass — 0 tests (no `#[test]` functions exist yet) |
| `bun run build` | Pass — writes SPA bundle to `build/` (~1m40s) |

### 3.2 Rust warnings (9 `cargo check`, 10 `cargo clippy`)

All originate from two sources:

1. **`src/utils/logger.rs`** — `static INIT`, `fn init`, and the six `log_trace` /
   `log_debug` / `log_info` / `log_warn` / `log_error` fns are declared `pub` but
   never called. They are skeleton code not yet wired into `lib.rs`.
2. **`src/providers/process/provider.rs:453`** — `clippy::type_complexity` on a
   return type `(Vec<(u32, Option<u32>, String)>, Vec<u32>)`. This file is inside
   the not-yet-`mod`-declared `providers/` tree (see AGENTS.md: providers are not
   compiled).

> **CI impact:** The `ci.yml` backend job runs
> `cargo clippy --all-targets --all-features -D warnings`. With `-D warnings`
> the type-complexity warning becomes a hard error (10 errors on lib, 8 on
> lib-test), so the CI clippy stage would **fail** if run today. Resolving this
> is an M0.4 task (allow attribute or type alias), **out of scope** for this
> baseline.

### 3.3 Frontend format check (fails)

`bun run format:check` reports **75 files** in `src/` that do not conform to
Prettier style (mostly `.svelte`/`.css`/`.ts` files under `src/lib/ui/`).

> **CI impact:** The `ci.yml` frontend job runs only `lint`, **not**
> `format:check`. So format failures do not currently break CI. Adding a
> `format:check` step to CI is an M0.4 task.

### 3.4 No test runner gaps

- `bun run test` (Vitest) discovers `tests/frontend/*.test.ts` → currently
  `navigation-config.test.ts` (8 passing assertions).
- `cargo test` compiles cleanly but asserts nothing (0 test functions).
- E2E / integration / unit dirs under `tests/` contain only `.gitkeep`.

## 4. CI vs. local: discrepancy noted

The AGENTS.md top note and `docs/40-engineering/CI.md` both state that the CI
workflow files are **"empty scaffolding"** and that **"No CI is configured."**
The on-disk reality is different:

- `.github/workflows/ci.yml` is **100% populated** (backend + frontend jobs:
  install → fmt check → cargo check → clippy `-D warnings` → cargo test →
  bun check → lint → test → build).
- `.github/workflows/release.yml` is **populated** (checkout → deps →
  `bun run build` → `bun run tauri build` → upload artifacts).
- `.github/workflows/lint.yml` **does not exist** (referenced in CI.md but not on
  disk).

This is a documentation-drift issue (CI.md says "empty", CI is live) but is
**not in scope** for this baseline pass — the task is to record the current state.
The CI design in `CI.md` is otherwise accurate and should be the source of truth
for the *intended* pipeline.

## 5. What was NOT changed

- No `src/` files touched.
- No `src-tauri/src/` files touched.
- No `package.json` scripts added or modified.
- No new dependencies installed.
- No new tooling introduced.

This baseline document is a recording; fixes (clippy allows, Prettier rewrites,
test scaffolding) are M0.4 work items.

## 6. Summary table

| Verification step | Status |
|---|---|
| `bun install` | ✅ pass |
| `bun run check` | ✅ pass (0/0) |
| `cargo check --manifest-path ./src-tauri/Cargo.toml` | ✅ pass (9 warnings) |
| `cargo clippy … --all-features` | ⚠️ 10 warnings |
| `cargo clippy … -D warnings` (CI mode) | ❌ 10+8 errors |
| `cargo fmt --check` | ✅ pass |
| `bun run lint` | ✅ pass |
| `bun run format:check` | ❌ 75 files unfmt'd |
| `bun run test` | ✅ 8 tests |
| `cargo test` | ✅ 0 tests (compiles) |
| `bun run build` | ✅ SPA bundle |
| `bun run tauri dev` | ✅ (manual, Wayland only) |
| Rust manifest path | Single canonical: `--manifest-path ./src-tauri/Cargo.toml` (no root `Cargo.toml`) |
