# Build from Source

## Purpose

This document is the canonical build guide for the DEX repository. It covers
the prerequisites, the exact build commands, the expected outcome of each
step, and the common failure modes with their fixes. Read it before your first
build; the verification order at the end is the gate for every change.

DEX is a Tauri 2 desktop shell: a SvelteKit (SPA) frontend in `src/` and a Rust
crate (`omnizya-dex`) in `src-tauri/`. Building it means building both halves.
The frontend is managed by **Bun** — never `npm`. The Rust crate is built with
`cargo` inside `src-tauri/`.

## Why these prerequisites exist

DEX targets Hyprland/Wayland on Arch Linux. The desktop window is a native
Tauri window backed by the system WebKit engine, so the build needs the
WebKitGTK development libraries and a working Rust toolchain. The frontend is
bundled by Vite, which is driven by Bun. Each prerequisite below maps to one
part of that toolchain; missing one produces a specific, identifiable failure
(see [Common failures](#common-failures-and-fixes)).

## Prerequisites

### 1. Operating system and display

- **Arch Linux** with a working **Wayland** session and **Hyprland**.
- A running display is required only for `bun run tauri dev` (the desktop
  window). `bun run check`, `cargo check`, and `cargo test` do not need a
  display.

### 2. System libraries (Arch packages)

These are the standard Tauri 2 Linux system dependencies. Install them with
`pacman`:

```sh
sudo pacman -S --needed \
  webkit2gtk-4.1 \
  gtk3 \
  libayatana-appindicator \
  librsvg \
  patchelf \
  base-devel
```

- `webkit2gtk-4.1` — the WebKit engine the Tauri window renders into. Missing
  it fails the Rust build with a `pkg-config` error for `webkit2gtk-4.1`.
- `libayatana-appindicator` — required because the `tauri` crate is built with
  the `tray-icon` feature (`src-tauri/Cargo.toml`). Missing it fails the Rust
  build with a `pkg-config` error for `ayatana-appindicator3-0.1`.
- `gtk3`, `librsvg`, `patchelf` — standard Tauri 2 build/runtime dependencies.
- `base-devel` — `make`, `gcc`, and the other build tools `cargo` needs to
  compile native crates.

### 3. Rust toolchain

Install via `rustup` (the crate uses edition 2021 and the stable toolchain):

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
```

Verify with `rustc --version` and `cargo --version`. The crate name is
`omnizya-dex`; the library target is `omnizya_dex_lib`
(`src-tauri/Cargo.toml`).

### 4. Bun

Bun is the package manager and script runner. Install it (on Arch it is also
available in the `extra` repository as `bun`):

```sh
curl -fsSL https://bun.sh/install | bash
# or: sudo pacman -S bun
```

Verify with `bun --version`. Every frontend command in this repository runs
through Bun. **Do not use `npm`** — the lockfile is `bun.lock`, and `npm`
would produce a different, incompatible dependency tree.

## Build steps

Run these from the repository root unless a step says otherwise.

### Step 1 — Install frontend dependencies

```sh
bun install
```

**Expected outcome:** `node_modules/` is populated and `bun.lock` is
satisfied. The command resolves the dependencies declared in `package.json`
(`@tauri-apps/api`, `@tauri-apps/plugin-log`, `@tauri-apps/plugin-opener`,
`zod`, `class-variance-authority`, `clsx`, plus the SvelteKit/Vite dev
toolchain).

**Failure mode:** `bun: command not found` — Bun is not installed (see
prerequisite 4). A `package-lock.json` appearing in the tree means someone ran
`npm`; remove it and re-run `bun install`.

### Step 2 — Type-check the frontend

```sh
bun run check
```

This runs `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`
(`package.json`). `svelte-kit sync` generates the `.svelte-kit/` type
definitions; `svelte-check` then type-checks the whole frontend against the
strict `tsconfig.json`.

**Expected outcome:** the command exits clean with no type errors. This is the
frontend gate and must pass before any change is ready for review.

**Failure mode:** type errors are reported with file and line. Fix them before
proceeding. A missing `.svelte-kit/` directory is normal on a fresh checkout —
`svelte-kit sync` regenerates it.

### Step 3 — Check the Rust crate

```sh
cd src-tauri
cargo check
```

`cargo check` compiles the crate without producing a binary — it is the fast
Rust gate. The crate is `omnizya-dex`; its library target is
`omnizya_dex_lib`, and `src-tauri/src/main.rs` calls `omnizya_dex_lib::run()`.

**Expected outcome:** compilation succeeds with no errors. The first run
downloads and compiles all dependencies (Tauri, Tokio, Serde, rusqlite with
the `bundled` feature, and the rest of `src-tauri/Cargo.toml`), so it takes
longer than subsequent runs.

**Failure mode:** a `pkg-config` error for `webkit2gtk-4.1` or
`ayatana-appindicator3-0.1` means a system library from prerequisite 2 is
missing. Install it and re-run. An error about an undeclared module means a
`mod` statement points at a file that is not compiled — see
[Undeclared Rust modules](#undeclared-rust-modules-are-not-compiled).

### Step 4 — Run the Rust tests

```sh
cargo test
```

**Expected outcome:** the test harness runs and reports a passing result. The
repository currently ships no Rust tests (the `tests/` tree is empty
scaffolding, roadmap M0.4), so the command compiles and reports zero tests
run. It is still the correct command to run once tests land.

### Step 5 — (Optional) Production frontend build

```sh
bun run build
```

This runs `vite build` and emits the static SPA into `build/` (the
`frontendDist` referenced by `src-tauri/tauri.conf.json`). It is not required
for local development — `bun run tauri dev` builds on demand — but it is the
step `beforeBuildCommand` runs when packaging a release.

## Common failures and fixes

### Missing system libraries

The Rust build fails with a `pkg-config` error naming a library. Install the
matching package from prerequisite 2 and re-run `cargo check`. The two most
common are `webkit2gtk-4.1` and `libayatana-appindicator` (the latter because
of the `tray-icon` feature).

### Port 1420 already in use

`vite.config.js` sets `server.port: 1420` with `strictPort: true`. If another
process holds the port, Vite refuses to start rather than picking a new one.
Find and stop the process, or run the frontend on a different machine where
the port is free. This is intentional: Tauri expects a fixed dev port.

### CSP complaints in dev mode

The strict Content-Security-Policy in `src-tauri/tauri.conf.json`
(`default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
connect-src ipc: http://ipc.localhost`) can trip Vite's dev-mode HMR. If it
does, loosen the policy **only for the dev configuration** — never ship the
loosened policy. The shipped policy is the security baseline (ADR-0005).

### Undeclared Rust modules are not compiled

`src-tauri/src/` contains many 0-byte scaffolding files that mirror the PRD.
A file is only compiled if its module is declared with `mod` in its parent
`mod.rs` (or `lib.rs`). Do not add a `mod` for a 0-byte file — it will fail to
compile. Only real, populated modules are declared today (`commands::core`,
`utils::errors`).

### Duplicate `invoke_handler`

`src-tauri/src/lib.rs` must contain **exactly one** `invoke_handler` call. A
second call silently shadows the first, so commands registered in the first
call stop working with no error. Append new commands to the single
`generate_handler![...]` (ADR-0002).

## Verification order

The fixed gate for every change, in order:

1. `bun run check` — frontend types.
2. `cargo check` in `src-tauri/` — Rust.
3. `bun run tauri dev` — desktop, manual, requires Wayland/Hyprland and a
   display (see [RunLocally.md](RunLocally.md)).

A change that fails step 1 or 2 is not ready for review. Step 3 is required
for any change that touches the shell surface, because transparent-window and
compositor behavior cannot be verified in a browser tab (ADR-0004).

## Related Documents

- Run the built shell: [`RunLocally.md`](RunLocally.md)
- Debugging the frontend, Rust, and IPC: [`Debug.md`](Debug.md)
- Performance budgets and measurement: [`Profiling.md`](Profiling.md)
- Repository map and wiring rules: [`ProjectStructure.md`](ProjectStructure.md)
- Coding standards (language, dependency, and verification rules):
  [`../40-engineering/CodingStandards.md`](../40-engineering/CodingStandards.md)
- Design system (tokens, motion, primitives):
  [`../40-engineering/DesignSystem.md`](../40-engineering/DesignSystem.md)
- System architecture: [`../20-architecture/20_System_Architecture.md`](../20-architecture/20_System_Architecture.md)
- Typed IPC contract: [`../50-adr/0002-typed-ipc-contract.md`](../50-adr/0002-typed-ipc-contract.md)
- Transparent compositing: [`../50-adr/0004-transparent-compositing.md`](../50-adr/0004-transparent-compositing.md)
- Roadmap (M0.4 tooling milestone): [`../10-product/11_Product_Roadmap.md`](../10-product/11_Product_Roadmap.md)
- Canonical terminology: [`../00-vision/03_Glossary.md`](../00-vision/03_Glossary.md)