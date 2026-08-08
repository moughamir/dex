# DEX M1.1 — Independent Review Report

> STATUS ADDENDUM (M1.2): the blockers recorded below were resolved in develop `5d133f6` (M1.1 merged). This document is retained as the historical review record.

**Status:** `M1.1 NEEDS CHANGES`
**Scope:** `Window — transparent, fullscreen, multi-monitor, DPI-aware`
**Reviewed tree:** `develop` HEAD `019e55f` (worktree `agent/m1.1-review`, clean)
**Date:** 2026-08-08
**Review method:** first-hand read of the native layer + commit `019e55f` diff, parallel specialist lanes for docs requirements, frontend shell/transparency, tests/IPC/verify, and Tauri 2 ACL verification. **No production code modified.**

---

## 1. Current M1.1 status

**What already works (real implementation, not just roadmap "Planned"):**

- **Dual-window startup exists**: `splashscreen` (420×280, transparent, undecorated, `alwaysOnTop`, `url: "/splashscreen"`) + `main` (transparent, undecorated, `fullscreen: true`, **`visible: false`** — no flash-on-create) — `src-tauri/tauri.conf.json:14-39`.
- **Transparency contract holds end-to-end** (verified layer by layer): `html`/`body`/`#svelte` `background: transparent` (`src/app.css:16-26`), `body` class `bg-transparent` (`src/app.html:12`), AppShell root `bg-transparent` (`AppShell.svelte:23`), and every effect/panel is translucent RGB-alpha over `backdrop-filter` (`--surface-*` 2–12% alpha `tokens.css:45-49`; `--glass-*` 5–18% `tokens.css:53-56`; Aurora ≤18% alpha + blur `effects.css:67-85`; Grid/Noise/Vignette/Spotlight/CursorGlow all low-alpha gradients `effects.css:90-188`). **No opaque layer found; no component applies the opaque `--bg-*` tokens.** The pre-ADR-0004 opaque body gradient is gone.
- **Startup gate is typed and IPC-clean**: `set_complete` is the only live end-to-end command (in **both** `COMMANDS` `commands.ts:438-442` and the **single** `generate_handler!` `lib.rs:55-58`). Two-flag `SetupState` (frontend/backend) → close splash, `show()` + `set_focus()` main (`commands/core.rs:38-69`). Single struct arg, snake_case, `AppError` envelope — ADR-0002 compliant.
- **CSP is strict and intact**: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src ipc: http://ipc.localhost` (`tauri.conf.json:42`), matches ADR-0005. No remote content, no dev CSP in the shipped config.
- **Boundaries hold**: `@tauri-apps/api` imported only in `core/api/{tauri,events}.ts` + `core/utils/logger.ts`; no frontend `@tauri-apps/api/window` anywhere; splash calls IPC through the sanctioned `core/api` wrapper. No Hyprland socket work (M4.4 boundary respected). No second invoke handler.
- **Frontend gates green**: format ✓ lint ✓ svelte-check 0/0 ✓ vitest **61/61 (8 files)** ✓ production build ✓ (verified locally; Rust steps run identically in CI on `develop`).

---

## 2. Required changes

Genuinely required for M1.1; nothing beyond the four-word scope:

1. **Splash-specific layout.** The root `+layout.svelte:24-26` wraps *every* route in `<HUD>`→`AppShell` (Background, TopBar, Sidebar, Dock, StatusBar). The `/splashscreen` route therefore renders the **full desktop shell inside a 420×280 window** — broken startup UX, and it runs the whole chrome (incl. pointer/rAF listeners) twice. Add `src/routes/splashscreen/+layout.svelte` (bare transparent wrapper) so the splash renders standalone.
2. **Remove fake initialization.** Frontend simulates readiness with hardcoded `setTimeout` 1500 ms + 1000 ms (`splashscreen/+page.svelte:13,15`); Rust sleeps a hardcoded 2 s (`lib.rs:9-21`). Net effect: the product surface appears at ≥2.5 s regardless of real readiness — violates the **<500 ms cold start hard budget** (PRD `10_Master_PRD.md:213-215`, `40-engineering/Performance.md:19-22`). Wire real ready signals (frontend: after `themeStore.init()`/first paint; backend: drop the sleep — `database::init` already runs in `setup`).
3. **Stuck-on-splash fallback.** If the splash page's `invoke` throws (or JS errors), `catch` sets `statusText` and never calls `set_complete` (`splashscreen/+page.svelte:19-22`) → splash never closes, main never shows, **no recovery path**. Add a Rust-side timeout (e.g. force `show()` main + close splash after N seconds) so the app cannot wedge.
4. **Splash logging + capability.** The splash uses `console.error` (`splashscreen/+page.svelte:20`) — violates the no-`console.*` convention. It also belongs to **no capability** (`capabilities/default.json` targets `"main"` only): custom commands work there (confirmed — custom app commands bypass the ACL absent an `AppManifest`, stable across Tauri 2.x), but `log:default` and any event/window API would be denied. Grant the splash window a minimal capability (at minimum `log:default`) and use the `logger` facade.
5. **Dev CSP for HMR.** No `devCsp` is set, so the strict `csp` applies in dev and blocks Vite's `ws://localhost:1420` HMR (`connect-src` has no `ws:`). Add a dev-only `devCsp` permitting the HMR ws; leave the production CSP untouched.
6. **Multi-monitor/DPI implementation.** This is the actual missing scope. There are **zero** window-event handlers in Rust (no `on_window_event`; no `Resized`/`ScaleFactorChanged`/`Moved`), and **zero** frontend DPR/resize/scale handling (no `devicePixelRatio`/`matchMedia`/`visualViewport`/resize listeners anywhere in `src/`). DPR-correct rendering comes free via WebKitGTK, but monitor changes, scale-factor changes, and fullscreen-after-hotplug are unhandled. Add minimal Rust `WindowEvent` handling (or document + verify Tauri defaults on Hyprland) — see §6.
7. **Test the gate.** `set_complete` (the entire splash→main transition) has **no test**; the 3 `commands/core.rs` tests cover only `greet`. Extract the two-flag decision into a pure function and unit-test it (close/show sequencing, invalid task, both orders of arrival). Frontend: test the splash page's success and error paths.

---

## 3. Blockers

1. **Splash renders inside the full shell chrome** (§2.1) — the shipped startup surface is visually broken (sidebar/dock/statusbar crammed into a 420×280 window). Must be fixed before acceptance.
2. **No failure recovery in the startup lifecycle** (§2.3) — any frontend IPC/JS error leaves the app permanently stuck on a frozen splash with the main window never shown ("error paths leaving the application in an unusable state").
3. **Artificial 2.5 s+ startup delay** (§2.2) — violates the documented **hard** cold-start budget (<500 ms to first interactive frame) and makes the splash a fake rather than a real init surface.

Not blockers: the transition mechanism itself works — the zero-capability splash *can* invoke `set_complete` (Tauri 2: custom app commands bypass the ACL when no `AppManifest` is defined and the origin is local). Transparency: no violations found.

---

## 4. Risks (non-blocking)

- **`backdrop-filter` over a transparent window**: WebKitGTK blurs the webview's *own* backdrop, which is transparent — the desktop may show through **unblurred** (panels flatter than intended). Known ADR-0004 concern ("verify on Hyprland"); may be a visual-only gap. Verify at the desktop gate; do not chase an X11 workaround.
- **`alwaysOnTop` likely no-ops on Wayland/Hyprland** (no standard Wayland hint; GTK hint ignored). Harmless today (main is hidden until splash closes), but document it.
- **Two webviews at startup**: duplicate SPA boot + elevated peak RAM (steady-state returns to one webview after splash close — the <200 MB idle budget is likely safe, but the cold-start budget is hit by the fake delays anyway).
- **Main shown before its SPA is ready**: `set_complete` fires on the *splash's* readiness, not the main window's DOM; a slow main could briefly show unrendered content. Consider a main-side ready signal.
- **Dead opaque `--bg-*` tokens** (`tokens.css:37-41`, theme blocks `:220,238,288`) are unreferenced today — a silent future transparency violation if a component ever uses `bg-(--bg-0)`. Remove or alpha-ize.
- **Capability hygiene**: `opener` plugin registered+granted but unused; five window permissions (`set-background-color`, `set-effects`, `set-shadow`, `set-decorations`, `set-title-bar-style`) granted but unused by any code. Least-privilege cleanup or documented intent.
- **ADR-0002 drift (pre-existing)**: `greet` is registered in Rust but has no TS contract (`commands.ts` has none) — the "wire contract in exactly two places" rule is half-broken. Not M1.1, flag for M0.5.
- **Fractional scaling**: Hyprland fractional-scale + WebKitGTK DPR handling — verify text crispness and no resize loops on mixed-DPI monitors.
- **`hiddenTitle`** is macOS-only (harmless); **`#app`** CSS block is dead (`app.css:35-40`); **dev HMR** blocked until devCsp added (risk above).

---

## 5. Verification matrix

| Requirement | Evidence | Status |
| --- | --- | --- |
| Transparent | `tauri.conf.json:23,35` (transparent both windows); `app.css:16-26`, `app.html:12`, `AppShell.svelte:23` (transparent roots); all tokens/effects translucent alpha (`tokens.css:45-56`, `effects.css`); no opaque full-window fill anywhere | **PASS** |
| Fullscreen | `tauri.conf.json:33` `fullscreen: true` on main; `visible: false` + `show()` on ready (`core.rs:62-65`) — config correct; runtime rendering on Hyprland still needs the manual desktop gate | **PASS** (config-level; manual gate pending) |
| Multi-monitor | No monitor handling anywhere: no `on_window_event`, no monitor/display code in Rust or TS; fullscreen relies on compositor defaults; hotplug/scale-switch unhandled | **FAIL** |
| DPI-aware | No DPR/scale/resize handling in `src/` or Rust; correctness currently relies entirely on WebKitGTK auto-scaling; unverified on Hyprland (incl. fractional scaling) | **FAIL** |
| Startup lifecycle | Two-window gate + `set_complete` work (invoke succeeds on zero-capability splash); but splash renders inside full shell chrome (`+layout.svelte:24-26`), no failure fallback (`splashscreen/+page.svelte:19-22`), fake 2.5 s+ delays (`:13,15`, `lib.rs:10`) | **FAIL** |
| Wayland | Hyprland/Wayland target honored; no X11-specific code; no Hyprland socket work (M4.4 boundary respected); only caveats are the alwaysOnTop hint and blur sampling (see §4) | **PASS** |
| Security | Strict CSP intact (`tauri.conf.json:42`), no remote scripts/connections, no dev-CSP leak; hygiene flags: unused window/opener grants, zero-capability splash window (§2.4, §4) | **PASS** (with hygiene caveats) |
| Performance | No polling loops, no resize feedback loops, CursorGlow rAF is pointer-gated (`CursorGlow.svelte:12-30`), StatusBar 1 s interval trivial; **but** cold-start budget broken by fake 2.5 s+ delay; no per-frame allocations found | **FAIL** (cold start) |
| Tests | 61 frontend + 58 Rust unit tests all green; **no** test covers splash→main transition, window, transparency, fullscreen, multi-monitor, DPI, or startup; `set_complete` untested; gate/CI headless-only by design (`verify.ts:15-25`, `ci.yml`) | **FAIL** |

---

## 6. Recommended implementation order

Smallest safe sequence (each step independently verifiable):

1. `src/routes/splashscreen/+layout.svelte` — bare transparent layout; splash stops rendering the shell chrome. *(fixes Blocker 1)*
2. Rust: remove the 2 s `setup_backend` sleep; keep the backend flag set immediately after real `setup` work. Frontend: delete the two fake `setTimeout`s; signal "frontend" after `themeStore.init()` + first paint. *(fixes Blocker 3)*
3. Rust: add a hard fallback timer (e.g. 10 s) that force-closes splash and shows main if flags never both land. *(fixes Blocker 2)*
4. Splash page: swap `console.error` → `logError`; add splashscreen window to a minimal capability with `log:default`. Run `bun run check`.
5. `tauri.conf.json`: add dev-only `devCsp` with the HMR `ws:`; confirm prod CSP untouched. Re-run `bun run tauri:dev`.
6. Rust: add `on_window_event` handling (`Resized`/`ScaleFactorChanged`/`Moved`) — minimal, no M4.4 logic — or, if defaults are accepted, document the decision in the commit. This is the "multi-monitor, DPI-aware" substance.
7. Extract the two-flag decision from `set_complete` into a pure fn; unit-test both arrival orders, invalid task, and the close/show call sequence. Add a frontend test for the splash success/error paths.
8. Hygiene (cheap, same commit or follow-up): drop unused window permissions + unused `opener` grants, remove dead `--bg-*` tokens / `#app` block.
9. Manual desktop gate on Hyprland (required before merge): transparency over wallpaper, fullscreen on correct monitor, drag between mixed-DPI monitors (text crispness, no resize loops), hotplug a monitor, cold-start timing, no flash. Per ADR-0004/`M0-4-Verification-Baseline.md`, this gate is Wayland-only and cannot be automated.

---

## 7. Final verdict

**`M1.1 NEEDS CHANGES`**

Not BLOCKED: the transparency contract is clean end-to-end, the IPC stays single-handler and typed, the CSP is intact, the splash→main transition mechanism works, and all three blockers are small, contained fixes. Not READY: multi-monitor and DPI have no implementation beyond compositor/WebKit defaults, the startup lifecycle has three blocker-class defects, and the window behavior has zero test or verification evidence. All required changes are inside the four-word M1.1 scope.

---

**Files inspected (first-hand):** `tauri.conf.json`, `src-tauri/src/{lib,main}.rs`, `commands/{core,mod}.rs`, `capabilities/default.json`, `Cargo.toml`, `splashscreen/+page.svelte`, `+layout.{ts,svelte}`, `+page.svelte`, `app.html`, `app.css`, `shell/theme.svelte.ts`, `HUD/AppShell/Background/Aurora/Grid/CursorGlow.svelte`, `core/api/{commands,tauri}.ts`, `core/utils/logger.ts`, `svelte.config.js`, `vite.config.js` + commit `019e55f` diff. Specialist lanes covered the 12 required docs, the full transparency chain + viewport/polling scan, the test/verify/IPC inventory, and Tauri 2 ACL semantics.
