# DEX M1.2 — Independent Review Report

**Status:** `M1.2 READY FOR REVIEW` (no blockers; merge pending user acceptance)
**Scope:** `HUD — TopBar, Dock, StatusBar, Viewport wiring`
**Reviewed tree:** `agent/m1.2-hud` (worktree `m1.2-hud`, based on `develop` `5d133f6`)
**Date:** 2026-08-08
**Review method:** first-hand read of the frontend HUD layer + diff vs `develop`, parallel specialist lanes for implementation (`fix-1`) and docs reconciliation (`fix-2`), independent architect review (`ora-1`) with follow-up fixes, and a controlled A/B desktop run on Hyprland to isolate a suspected startup regression. **No production code modified by the review itself.**

---

## 1. Current M1.2 status

**Milestone scope (roadmap `11_Product_Roadmap.md:92`):** TopBar, Dock, StatusBar, Viewport wiring.

**What was delivered (all on `agent/m1.2-hud`, 10 files modified + 3 new):**

- **Viewport extraction** — `src/lib/ui/layout/Viewport.svelte` (new): `<main>` landmark, `flex-1 overflow-y-auto p-8`, token-padding incl. dock-aware bottom padding reading `shellStore.dockVisible`, inner wrapper `mx-auto w-full max-w-(--content-max-width)` (1200px, `tokens.css:150`), default slot. `AppShell.svelte` replaces its inline `<main>` with `<Viewport>{@render children?.()}</Viewport>`; exported from `ui/layout/index.ts`.
- **Interaction surface** — one sidebar-collapse toggle in `TopBar.svelte` (ghost icon button, lucide `PanelLeftClose`/`PanelLeftOpen`, `aria-label="Toggle sidebar"`, `aria-pressed={shellStore.sidebarCollapsed}`, `onclick={shellStore.toggleSidebar}`). SearchBox/Bell/Settings remain inert (deferred to M5.x); no dock auto-hide; StatusBar keeps the "DEX v0.1.0" hardcode.
- **Single reactive source of truth for the active workspace** — `shell.svelte.ts` now uses `import { page } from "$app/state"` (module scope) with a class field `activeWorkspace = $derived(resolveWorkspace(page.url.pathname))`; `init()` is an idempotent no-op boot hook called from `+layout.svelte:27`. `Dock.svelte` consumes `$derived(shellStore.activeWorkspace)` instead of re-deriving from `page`; the duplicated resolver and `selectWorkspace()` were removed. `+layout.svelte` itself is **unchanged** in M1.2 (static HUD import, `isSplash` derived, onMount inits theme/shell/window stores only when `!isSplash`).
- **ADR-0003 reconciliation** — `core/config/layout.ts`: `hudHeight` 72→56, `borderRadius` 20→18 (tokens now match the import).
- **Tests** — `tests/frontend/shell-store.test.ts` (8 cases) backed by a rune-compatible `$app/state` double `tests/frontend/stubs/app-state.svelte.ts`; an idempotence test asserts repeated `init()` is a safe no-op.

**M1.2 decisions (recorded with user approval; bounded scope):** Viewport as an extracted component (not inline) • single interaction surface in TopBar only • `$app/state` + `$derived` as the single reactive workspace source • ADR-0003 token reconciliation (56/18) • rune-backed store test with `$app/state` stub. All five are inside the four-word milestone scope.

---

## 2. Independent review

**Architect review (`ora-1`): `APPROVED WITH MINOR NOTES`.** All three notes were addressed:

1. **Store reactivity** — rewritten from manual state/effect juggling to `$derived` on `$app/state` (single reactive source of truth, no init race).
2. **Architecture doc** — `20_System_Architecture.md:85` folder list now includes Viewport under `ui/layout/`.
3. **Test design** — redesigned around the rune-backed `$app/state` stub; idempotence covered explicitly.

Pre-existing, non-blocking nits accepted as documented: Viewport `overflow-y-auto` (content scroll lives in the viewport by design), boot flash of "dashboard" before `init()` resolves the path, `layout.ts` remaining as a third dimension source for chrome geometry, `aria-pressed` without `aria-controls`, and the component-wiring test gap (mitigated by the manual Wayland gate — do not skip).

---

## 3. Verification

| Gate | Result |
| --- | --- |
| `format:check` / `cargo:fmt:check` | PASS (format applied once) |
| `lint` (eslint) | PASS |
| `check` (svelte-check) | PASS (0 errors / 0 warnings) |
| `cargo:clippy` / `cargo:check` | PASS |
| `test` (vitest) | PASS — **88/88 across 11 files** (incl. 8 new shell-store cases) |
| `build` (vite production) | PASS |
| `cargo:test` | PASS — 67/67 |
| `bun run verify` (all nine, fail-fast) | **PASS** |

Rust/IPC layer untouched in M1.2 (no `commands/`, no `generate_handler!`, no migration); ADR-0001/0002/0004/0005 contracts unaffected.

---

## 4. Native desktop gate (Hyprland, manual)

**Verdict: PASS with one documented known issue.**

Controlled A/B harness (`/tmp/opencode/dex-ab2.sh`, PID-only kill, polls t+1..t+14s via `hyprctl`):

- **M1.1 @ 20:54** — splash "Loading DEX" [532,392] visible t+2s..t+12s; main fullscreen only at **t+14s** (M1.1 took the 10s Rust fallback).
- **M1.2 @ 20:55** — main fullscreen at **t+4s** (handshake completed normally).

Both runs produced identical app logs (3 asset-fallback DEBUG lines + `window store ready` at +1s, same chunk hash) and no WARN/ERROR lines anywhere in `dex.log`. An earlier M1.2 run had shown splash through t+10s, and an earlier M1.1 baseline had shown main at t+4s — i.e. **both binaries exhibit both behaviors**.

**Conclusion: the splash-handshake variation is environmental flakiness (Hyprland/WebKitGTK webview mount timing), not an M1.2 regression.** Worst case is a slow splash: the 10s Rust fallback (`lib.rs:38-73`) force-completes splash→main if the flags never land, so the app cannot wedge. Hardening the handshake (splash webview mount / double-rAF timing) would reach into M1.1 startup code outside M1.2's bounded scope — deferred to a future milestone; the `lib.rs:19` `setup_backend` seam is the intended landing point.

Note: `logger.rs`'s tracing facade is scaffolded — `init()` is never called by the crate, so the fallback's `log_warn` is invisible in logs. Absence of WARN proves nothing; the A/B timings are the evidence.

---

## 5. Remaining risks (non-blocking)

- **Flaky splash handshake** (above) — environmental, self-healing, affects both M1.1 and M1.2; hardening deferred.
- **Component-wiring test gap** — HUD render integration is covered only by the manual desktop gate; unit coverage is store-level. Acceptable for M1.2, worth revisiting when the M1.3 primitive set lands.
- **Documentation debt (pre-existing, unchanged by M1.2):** `Build.md` stale counts (58 Rust / 61 frontend files), `ProjectStructure.md` stale inventory, `Debug.md`/`Profiling.md` unaudited, `AGENTS.md` lacks the ADR-0006/`window.ts` refs, `commands/core.rs:245` typo.
- **StatusBar hardcode** — "DEX v0.1.0" version string is static until a settings/version slice exists.

---

## 6. Final verdict

**`M1.2 READY FOR REVIEW`**

All gates green (9/9 verify, 88 vitest, 67 cargo), architect review approved with notes and all notes addressed, native desktop gate passed with a documented environmental known issue that predates M1.2 and self-heals. The milestone delivers the full HUD scope (TopBar, Dock, StatusBar, Viewport wiring) within its four-word boundary. Merge to `develop` is recommended pending user acceptance.

---

**Files inspected (first-hand):** `src/lib/ui/layout/{Viewport,AppShell,Dock,TopBar}.svelte`, `src/lib/ui/layout/index.ts`, `src/lib/core/stores/shell.svelte.ts`, `src/lib/core/config/layout.ts`, `src/routes/+layout.svelte` (unchanged), `tests/frontend/shell-store.test.ts`, `tests/frontend/stubs/app-state.svelte.ts`, `docs/20-architecture/20_System_Architecture.md`, `docs/20-architecture/21_Frontend.md`, `docs/90-dev/{RunLocally,M1-1-Review}.md`, `tauri.conf.json`, `src-tauri/src/lib.rs`, `src-tauri/src/commands/core.rs`, `src-tauri/src/utils/logger.rs`. Specialist lanes covered implementation, docs reconciliation, and independent architecture review.
