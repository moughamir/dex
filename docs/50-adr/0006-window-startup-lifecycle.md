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
   backend_task: bool, shown: bool }` held in Tauri managed state behind a single
   `Mutex` (`commands/core.rs`). Each half reports completion through the
   `set_complete` command with its task name (`"frontend"` / `"backend"`;
   anything else is a validation error). The pure predicate
   `startup_gate(frontend, backend, shown) = !shown && frontend && backend`
   decides the handoff, so the splashscreen → main transition fires exactly once:
   it closes the splashscreen window, then shows and focuses the main window, and
   sets `shown = true`. A later `set_complete` is a no-op.

3. **Backend init** — Rust `setup` runs `database::init(<app_data_dir>/dex.db)`
   synchronously, then spawns `setup_backend`, which completes immediately:
   there is no artificial delay. The spawned async lane is the seam where real
   asynchronous service bring-up (providers, DB warm-up) lands in later
   milestones; today it simply reports `set_complete("backend")`.

4. **Frontend init** — the splashscreen route signals readiness on first paint:
   it awaits a double `requestAnimationFrame`, then calls
   `set_complete("frontend")` via the `core/api` boundary (ADR-0002). There is no
   staged fake init. On failure it logs via `logError` and shows "Initialization
   error"; recovery is the Rust fallback, not the frontend.

5. **Failure fallback** — Rust spawns `startup_fallback`, which sleeps for
   `STARTUP_HANDSHAKE_TIMEOUT_SECS = 10 s` and then, only if `shown` is still
   false, force-completes the transition (closes splashscreen, shows and focuses
   main, sets `shown = true`) and logs a warning via `log_warn`. After a
   successful handshake it is a no-op. The app can never be stranded on a hidden
   main window.

6. **Error contract** — `set_complete` returns `AppError::validation` for an
   unknown task name and `AppError::internal` if the state mutex cannot be
   locked. The command takes exactly one serde struct arg and returns `null`
   on success (infallible wire result → `z.null()` in the TS registry).

7. **First end-to-end command** — `set_complete` is the first command wired
   through the full ADR-0002 checklist: Rust handler + `generate_handler!`
   entry + `COMMANDS` zod contract. `greet` remains Rust-only (no TS contract).

## Consequences

- Deterministic, exactly-once handoff: the main window never renders before both
  halves are ready, and the transition cannot double-fire; the user always sees
  either the splashscreen or a fully initialized shell, never a stranded hidden
  main window.
- The splashscreen window is deliberately zero-capability (the capability set
  targets `windows: ["main"]` only). This least-privilege posture stays valid
  because the root layout gates the main-window `windowStore.init()` off the
  splash route — no window calls that would be ACL-denied on the splash run
  there.
- No artificial startup delays: the splash is shown only for as long as real
  init actually takes, respecting the cold-start budget.
- Future startup work (providers, plugin loads) slots into the `setup_backend`
  async lane without changing the handoff contract.
