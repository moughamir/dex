# ADR-0006: Window Startup Lifecycle (Splash → Main Handoff)

- Status: Accepted
- Date: 2026-08-08
- Deciders: Principal Architect
- Scope: The two-window startup sequence and the frontend/backend readiness barrier (M1.1 Window)

## Context

The desktop shell must appear only after both halves are ready: the Rust backend
must have initialized the database, and the frontend must have finished its own
startup work. Showing a half-initialized main window looks broken; holding the
window invisible with no feedback looks hung. The solution is a dedicated
splashscreen window that reports setup progress, with the main window hidden
until both sides signal readiness.

Tauri 2 already supports multiple windows with independent configuration
(`tauri.conf.json`), and a hidden-then-shown main window (`visible: false`) with
a splashscreen overlay is the documented pattern.

## Decision

1. **Two windows** (`tauri.conf.json`):
   - `splashscreen`: 420×280, transparent, `decorations: false`,
     `alwaysOnTop: true`, URL `/splashscreen`.
   - `main`: 800×600, `fullscreen: true`, transparent, `decorations: false`,
     `shadow: false`, `hiddenTitle: true`, `visible: false`.

2. **Readiness barrier** — a shared `SetupState { frontend_task: bool,
   backend_task: bool }` held in Tauri managed state behind a `Mutex`
   (`commands/core.rs`). Each half completes its init and calls the
   `set_complete` command with its task name (`"frontend"` / `"backend"`).
   When both flags are set, the handler closes the splashscreen window;
   the main window then shows and focuses.

3. **Backend init** — Rust `setup` runs `database::init(<app_data_dir>/dex.db)`,
   then `setup_backend` (a ~2 s stand-in for real service bring-up), then
   `set_complete("backend")`.

4. **Frontend init** — the splashscreen route runs a staged fake init
   (1500 ms + 1000 ms ≈ 2.5 s) and then calls `set_complete("frontend")`
   directly via `COMMANDS.setComplete` (the `core/api` boundary, ADR-0002).

5. **Error contract** — `set_complete` returns `AppError::validation` for an
   unknown task name and `AppError::internal` if the state mutex cannot be
   locked. The command takes exactly one serde struct arg and returns `null`
   on success (infallible wire result → `z.null()` in the TS registry).

6. **First end-to-end command** — `set_complete` is the first command wired
   through the full ADR-0002 checklist: Rust handler + `generate_handler!`
   entry + `COMMANDS` zod contract. `greet` remains Rust-only (no TS contract).

## Consequences

- Deterministic handoff: the main window never renders before both halves are
  ready; the user always sees either the splashscreen or a fully initialized
  shell.
- The splashscreen window is deliberately not granted window capabilities
  (the capability set targets `windows: ["main"]` only) — acceptable today
  because the splash never needs them; revisit if it grows interactive chrome.
- Future startup work (providers, plugin loads) slots into the `setup_backend`
  step without changing the handoff contract.
