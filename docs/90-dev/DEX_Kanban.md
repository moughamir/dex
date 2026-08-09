---
project: omnizya-dex
type: canonical-kanban
authority: project-state
updated: 2026-08-09
---

# DEX — Canonical Engineering Kanban

## 🧭 Current State

- Current Phase: Phase 2 — Graphics Engine
- Current Milestone: M2.3 — Animation Engine (not started; M2.2 DONE)
- Branch: develop @ 1931421 (M2.2 merged; origin/develop @ 408498e, local ahead 3)
- Commit: 1931421 — feat(graphics): M2.2 effects (bloom, fog, background, grid, particles) (squash)
- CI: PASS (`bun run verify` 9/9, 2026-08-09, on branch tip pre-merge and develop HEAD post-merge)
- Verification: AUTOMATED VERIFIED — Vitest 160/160 (22 files), Rust 67/67, svelte-check 0/0, clippy/build/format/lint PASS
- Native Verification: PASSED (smoke, 2026-08-09) — debug binary (`cargo build`, no bundler) on real Wayland/sway display: transparent fullscreen window, WebGL scene live. Pixel analysis: corners EXACT match to wallpaper (TL 42,15,69 / TR 22,6,43 / BL 8,5,12 / BR 42,49,130 — transparency preserved with bloom ON, no alpha accumulation); 20.8% of pixels change between frames 2s apart (particles/fog animating; M2.1 was 3.8%); center distinct from corners (vignette + bloom). Screenshots `/tmp/opencode/m22-native-*.png`.
- Overall Status: M2.2 DONE — accepted (3-lane independent review; 2 MAJORs closed + spot re-review READY) + merged to develop 1931421; M2.3 next

## 📊 Milestone Progress

| Milestone | Goal | Status | Progress | Blockers |
|---|---|---|---|---:|---|
| M0.1 | Project Architecture | DONE | 100% | — |
| M0.2 | Design System | DONE | 100% | — |
| M0.3 | Core Infrastructure | DONE | 100% | — |
| M0.4 | Development Tooling / CI | DONE | 100% | — |
| M1.1 | Window Layer | DONE | 100% | — |
| M1.2 | HUD / Application Shell | DONE | 100% | — |
| M1.3 | UI Components | DONE | 100% | residual debts below |
| M1.4 | Theme / Visual System | DONE | 100% | deferred theme debt below |
| M2.1 | Three.js Core (renderer, scene, camera, lights) | DONE | 100% | — |
| M2.2 | Effects (bloom, fog, background, grid, particles) | DONE | 100% | — |

> Milestone names per canonical `docs/10-product/11_Product_Roadmap.md` (M0.1–M0.4 only; no M0.5/M0.6). M9.4 = Documentation, M9.5 = Release (v1.0).

---

## 🧱 BACKLOG

- [ ] **[M1.1]** Harden splash handshake flakiness
  - ID: M1.1-WIN-001
  - Source: M1-3-Review.md §5; M1.1/M1.2 reviews
  - Priority: P2
  - Dependency: none
  - Acceptance: splash→main handshake deterministic under cold start; no self-healing dependency
  - Note: pre-existing, self-healing, out of M1.x scope. Revisit at M9 hardening or when window layer is next touched.

---

## 📌 TODO

Deferred out of M1.4 (per M1-4-Review.md) — fold into M2.x+ or M9 hardening:

- [ ] **[M1.4 → deferred]** Motion system formalization
  - ID: M1.4-THEME-003
  - Source: roadmap M1.4 objective, status reconciliation
  - Priority: P1
  - Dependency: M1.4-THEME-001/002 (token foundation)
  - Acceptance: enter/exit/hover/press/focus/expand/collapse/theme-transition motion tokens; `prefers-reduced-motion` honored
  - Note: deferred in M1-4-Review.md to keep M1.4 bounded; revisit at M2.x+ or M9
- [ ] **[M1.4 → deferred]** Component-state consistency audit
  - ID: M1.4-THEME-004
  - Source: roadmap M1.4 objective
  - Priority: P2
  - Dependency: M1.4-THEME-001
  - Acceptance: hover/press/focus/disabled/selected states tokenized across all primitives
- [ ] **[M1.4 → deferred]** Deprecate legacy token aliases
  - ID: M1.4-THEME-005
  - Source: frontend audit 2026-08-09 (`--dex-font-size-xs`, `--dex-tracking-wide`)
  - Priority: P3
  - Dependency: M1.4-THEME-001
  - Acceptance: aliases removed or marked deprecated; no consumers
- [ ] **[M1.4 → deferred]** Extended typography/width scales
  - ID: M1.4-THEME-006 (remainder of THEME-001/002)
  - Source: M1-4-Review.md — THEME-001/002 delivered partial scope
  - Priority: P3
  - Dependency: none
  - Acceptance: `--font-weight-*`, line-height, `--font-family-*` (ui/mono), `--type-*` semantic scale; full `--width-*` scale
- [ ] **[M1.4 → partial]** Theme/token behavior tests
  - ID: M1.4-TEST-001
  - Source: Testing.md contract
  - Priority: P2
  - Dependency: M1.4-THEME-003
  - Acceptance: delivered — 5 jsdom tests (mode switching dark/light/cyber, token resolution, persistence). Remaining: reduced-motion behavior, token-resolution across themes
  - Note: reduced-motion coverage deferred with THEME-003 motion work

---

## 🔨 WIP

(none — M2.2 in IN REVIEW)

---

## 🔍 IN REVIEW

(none — M2.2 accepted and merged; M2.3 not started)

---

## ✅ DONE

- [x] **[M0.1–M0.4]** Foundation: architecture, design system, core infra, tooling/CI
  - Accepted: roadmap `[x]`; M0-4-Verification-Baseline.md (Superseded 2026-08-08, historical)
  - Evidence: commits 0f67459…074aa13; nine-gate verify operational
  - Verification: gate + CI live
  - Commit: 074aa13
- [x] **[M1.1]** Window layer + startup handshake
  - Accepted: roadmap `[x]`; review verdict NEEDS CHANGES → resolved in develop 5d133f6
  - Evidence: commit 5d133f6; vitest 61/61, 58 Rust (at review time)
  - Verification: AUTOMATED VERIFIED at HEAD (re-verified 2026-08-09)
  - Commit: 5d133f6
- [x] **[M1.2]** HUD / AppShell
  - Accepted: roadmap `[x]`; M1-2-Review.md (verdict READY FOR REVIEW), shipped
  - Evidence: commit 8a2a2c7; vitest 88/88, Rust 67/67 (at review time)
  - Verification: AUTOMATED VERIFIED at HEAD (re-verified 2026-08-09)
  - Commit: 8a2a2c7
- [x] **[M1.3]** UI primitives — GlassPanel, Button, Tooltip, Card, Modal, ContextMenu, Dropdown
  - Accepted: M1-3-Review.md — READY FOR MERGE; architect APPROVE WITH MINOR NOTES; merged to develop 89e8c8e
  - Evidence: commit 89e8c8e; ADR-0007 (D1 floating-ui/dom, D2 body portal, D3 glass backdrop)
  - Verification: `bun run verify` 9/9 single run 2026-08-09 (closes review's split-run caveat); Vitest 111/111, Rust 67/67, svelte-check 0/0
  - Commit: 89e8c8e
  - Residual debt: see Technical Debt + M1.3-TEST-* cards
- [x] **[M1.3]** Documentation drift reconciliation (pre-M1.4 prerequisite)
  - ID: M1.3-DOC-001 (001/002/003 closed: architecture status, Feature Matrix prose, Testing.md counts)
  - Evidence: 20_System_Architecture.md M1.4-current line, 14_Feature_Matrix.md prose aligned, Testing.md → 16 files/116/67
  - Remaining: 004–007 still open (see Documentation Debt)
- [x] **[M1.4]** Theme / Visual System — live switching end to end
  - Accepted: M1-4-Review.md — READY FOR MERGE; architect APPROVE WITH MINOR NOTES; merged to develop 3e0a38e
  - Evidence: commit 3e0a38e; ThemeSwitcher (Dropdown + themeStore) in TopBar actions; tokens.css `--font-size-*` scale + `--modal-max-width`; Modal token substitutions (M1.3 M2/M3 carry-forward resolved); PRD TH-2 (runtime switch, persisted, applied before next paint)
  - Cards closed: M1.4-THEME-001 (partial: font-size scale), M1.4-THEME-002 (partial: modal-max-width), M1.4-DOC-001 (roadmap `[x]` + feature matrix Built)
  - Verification: `bun run verify` 9/9 + `bun run cargo:test` exit 0 (2026-08-09); Vitest 116/116 (16 files), Rust 67/67, svelte-check 0/0
  - Commit: 3e0a38e
  - Residual debt: THEME-003/004/005/006 + TEST-001 partial (see TODO); M1.3-TEST-* carry
- [x] **[M2.1]** Three.js Core — renderer, scene, camera, lights + shell backdrop
  - Accepted: independent 4-lane review (architect, implementation, security, docs) — 0 Critical/Major; consensus one-liners folded (3ea9321); merged to develop 56f9aa6 (squash)
  - Evidence: ADR-0008; 25_Graphics.md/README/Testing.md reconciled; contracts.ts DI seam; GraphicsBackdrop mounted in AppShell
  - Verification: `bun run verify` 9/9 ALL GATES PASSED pre- and post-merge (2026-08-09); Vitest 141/141 (21 files), Rust 67/67, svelte-check 0/0
  - Native: PASSED (smoke) + pixel-corroborated at acceptance; screenshots /tmp/opencode/dex-native-*.png
  - Commit: 56f9aa6
  - Residual debt: M2.1-TEST-001 (inert fallback test); M2.1-GFX-001…005 (see TECHNICAL DEBT)
- [x] **[M2.2]** Effects — bloom, fog, background, grid, particles
  - Accepted: 3-lane independent review (architect, implementation, security) — 2 MAJOR (bloom alpha ADR-0004 breach; flat-tint vignette) + minors, all closed across fix rounds; spot re-review (ora-6) READY; merged to develop 1931421 (squash)
  - Evidence: compose seam (ComposeContext/RenderCompose) + EFFECTS_CONFIG boot-time toggle; effects/{manager,fog,background,grid,particles,color}.ts; shaders/background.glsl.ts; backdrop wiring with GFX-001 (DPR re-arm) + GFX-004 (palette-before-start) folded in; 25_Graphics.md M2.2 section + graphics/README.md reconciled
  - Verification: `bun run verify` 9/9 ALL GATES PASSED (2026-08-09); Vitest 160/160 (22 files), Rust 67/67, svelte-check 0/0
  - Native: PASSED — pixel-corroborated: corners = wallpaper exactly (transparency with bloom ON), 20.8% frame animation; /tmp/opencode/m22-native-*.png
  - Commit: 1931421
  - Residual debt: M2.1-TEST-001; M2.1-GFX-002/003/005 (see TECHNICAL DEBT)

---

## 🚧 BLOCKED

(none)

---

## 🧹 TECHNICAL DEBT

- [ ] **[M1.3]** Card / Dropdown / Modal / ContextMenu not consumed by running app (infrastructure awaiting M1.4+ feature surfaces)
  - Severity: P3 (by design; primitives must not be hardwired into shell)
  - Milestone: M1.3 → revisit at first consumer
  - Reason deferred: shell features land in M1.4+ (ThemeSwitcher now consumes Dropdown)
- [ ] **[M1.3]** Portal action duplicated (6 lines, Modal + ContextMenu)
  - ID: M1.3-UI-001
  - Severity: P3
  - Milestone: M1.3
  - Reason deferred: extract when a third consumer appears (N3)
- [ ] **[M1.3]** ContextMenu focus-restore lands on wrapper
  - ID: M1.3-UI-002
  - Severity: P3
  - Milestone: M1.3
  - Reason deferred: review note N1
- [ ] **[M1.1]** Splash handshake flakiness — see BACKLOG M1.1-WIN-001
- [ ] **[M1.4]** Legacy token aliases — see M1.4-THEME-005
- [ ] **[M1.4]** Motion / state-audit / extended scales — see M1.4-THEME-003/004/006
- [ ] **[M2.1]** Inert-renderer fallback path untested
  - ID: M2.1-TEST-001
  - Severity: P3
  - Milestone: M2.1
  - Reason deferred: reviewer-flagged (architect F4, implementation #3); coverage gap only — add a test stubbing `THREE.WebGLRenderer` to throw and asserting the inert surface contract
- [x] **[M2.1]** DPR-change media query is one-shot (fires only the first change)
  - ID: M2.1-GFX-001
  - Severity: P3
  - Milestone: M2.2
  - Reason deferred: architect F1 — re-create the `(resolution: Xdppx)` query inside the change handler; masked by resize events on monitor moves
  - RESOLVED: M2.2 (1931421) — query re-created inside the resize handler in GraphicsBackdrop
- [ ] **[M2.1]** `--z-background` token unused; backdrop + Background hardcode `-z-50`
  - ID: M2.1-GFX-002
  - Severity: P3
  - Milestone: M2.2
  - Reason deferred: architect F2/R3 — both layers must move to the token together to preserve canvas-under-DOM-effects order
- [ ] **[M2.1]** Context-loss pause/restore not handled (three-internal handling only)
  - ID: M2.1-GFX-003
  - Severity: P3
  - Milestone: M2.2
  - Reason deferred: architect F3/R2 — pause loop on `lost`, re-assert backing-store size + resume on `restored`
- [x] **[M2.1]** Palette push precedes renderer start (first frame default-lit)
  - ID: M2.1-GFX-004
  - Severity: P4 (Nit)
  - Milestone: M2.2
  - Reason deferred: architect F7 — assign `renderer = created` before `start()` in the mount action; invisible with the empty scene
  - RESOLVED: M2.2 (1931421) — initial palette applied at construction
- [ ] **[M2.1]** Empty-scene rAF runs at 60 fps for the shell lifetime
  - ID: M2.1-GFX-005
  - Severity: P3
  - Milestone: M2.2/M2.4
  - Reason deferred: security + architect R4 — consider dirty-flag render skip / `visibilitychange` pause; `powerPreference: high-performance` biases discrete GPU

---

## 📚 DOCUMENTATION DEBT

- [ ] **[M1.3]** `AGENTS.md` live-vs-placeholder inventory stale (services/composables implemented; `system/`+`events/emitter.rs` real-but-uncompiled; ADR-0006/0007 refs; test count 56→67)
  - ID: M1.3-DOC-004
  - Drift: claims vs tree
  - Required reconciliation: refresh inventory
- [ ] **[M1.3]** `Build.md` / `ProjectStructure.md` stale counts (from M1.3 review §5)
  - ID: M1.3-DOC-005
  - Drift: numbers vs actual
  - Required reconciliation: refresh
- [ ] **[M1.3]** `Debug.md` / `Profiling.md` unaudited
  - ID: M1.3-DOC-006
  - Drift: unverified content
  - Required reconciliation: audit or mark
- [ ] **[M1.3]** "No release pipeline yet" wording vs `release.yml` skeleton (build bundle on tag, upload artifact; publishing deferred to M9.x)
  - ID: M1.3-DOC-007
  - Drift: AGENTS.md wording
  - Required reconciliation: clarify packaging pipeline exists, publishing M9.x

---

## 🧪 VERIFICATION DEBT

- [ ] **[M1.3]** Keyboard-path test gaps for overlay primitives
  - ID: M1.3-TEST-001
  - Feature: ContextMenu / Dropdown / Modal
  - Missing: Shift+F10, Home/End, ArrowUp wrap-around, Tab-close, `menuitemcheckbox`, Modal focus trap assertions
  - Required environment: jsdom (existing harnesses)
  - Note: review §5 M5, deferred to keep review bounded; fold into M2.x-TEST-001 or standalone
- [ ] **[M1.3]** Unlabeled-Modal runtime warning absent
  - ID: M1.3-TEST-002
  - Feature: Modal
  - Missing: accessibility warning when no accessible label
  - Required environment: jsdom
  - Note: review §5 M4; tracked for when Modal internals next touched
- [ ] **[M1.4]** Reduced-motion + cross-theme token-resolution tests
  - ID: M1.4-TEST-001 (remainder)
  - Feature: theme store / tokens
  - Missing: `prefers-reduced-motion` behavior; token resolution assertions across themes
  - Required environment: jsdom
  - Note: deferred with M1.4-THEME-003 motion work

---

## 🏗️ ARCHITECTURAL DECISIONS

- ADR-0001 — Layer ownership
- ADR-0002 — Typed IPC contract
- ADR-0003 — Design tokens
- ADR-0004 — Transparent compositing
- ADR-0005 — Plugin boundary
- ADR-0006 — Window startup lifecycle
- ADR-0007 — Overlay primitives (D1 floating-ui/dom, D2 body portal, D3 glass/blur backdrop)
- ADR-0008 — Three.js as the graphics renderer (WebGL2, transparent, DPR, single rAF owner, DI seam)

---

## 🔗 ACTIVE WORKTREES

| Worktree | Branch | Purpose | Status |
|---|---|---|---|
| (pruned) | agent/docs-librarian @ dad9031 | M0.4 docs alignment | PRUNED (was MERGED) |
| (pruned) | agent/m1.1-review @ 735ffa9 | M1.1 review (NEEDS CHANGES) | PRUNED (content superseded by M1-1-Review.md) |
| (pruned) | agent/m1.1-window @ 729c966 | M1.1 window work | PRUNED (IPC wrap folded into 5d133f6) |
| (pruned) | agent/m1.2-review @ 5d133f6 | M1.2 review | PRUNED (was MERGED) |
| (pruned) | agent/m1.3-ui-components @ df10d77 | M1.3 primitives | PRUNED (squash-merged as 89e8c8e) |
| (pruned) | feat/m2.1-graphics @ decfd45 | M2.1 work branch | MERGED (squash-merged as 56f9aa6; ref kept until report) |
| (pruned) | feat/m2.2-effects @ ab93156 | M2.2 effects work | PRUNED (squash-merged as 1931421) |
| — | agent/m1.4-theme @ 88c60cd | M1.4 theme | DELETED (local + remote; squash-merged 3e0a38e) |

---

## 🧾 RECENT CHANGES

- 2026-08-09 — **M2.2 ACCEPTED + MERGED to develop (1931421, squash)**: effects subsystem (bloom/fog/background/grid/particles + compose seam + EFFECTS_CONFIG) shipped; 3-lane review (architect/implementation/security) — 2 MAJOR (bloom alpha ADR-0004 breach; flat-tint vignette) + minors closed across fix rounds; spot re-review READY; `bun run verify` 9/9 PASS; native smoke pixel-corroborated (corners = wallpaper exactly with bloom ON; 20.8% frame animation); roadmap M2.2 `[x]`, Feature Matrix Built; GFX-001/004 resolved
- 2026-08-09 — **M2.1 ACCEPTED + MERGED to develop (56f9aa6, squash)**: 4-lane independent review (architect/implementation/security/docs) — 0 Critical/Major; consensus one-liners folded (3ea9321); doc debt fixed (8dd3543, Testing.md 43→47 + AGENTS.md graphics inventory); `bun run verify` 9/9 PASS pre- and post-merge; native smoke pixel-corroborated; roadmap M2.1 `[x]`, Feature Matrix Built
- 2026-08-09 — M2.1 implementation complete → IN REVIEW: commit e36f6f2 on feat/m2.1-graphics (17 files); `bun run verify` 9/9 ALL GATES PASSED; oracle review READY FOR IN REVIEW (3 Minor + 3 Nits folded in); ADR-0008; 25_Graphics.md/README/Testing.md reconciled; native gate queued
- 2026-08-09 — Final pre-M2.1 baseline: @types/node chore (408498e) pushed to origin/develop; Status/Kanban refreshed to 408498e; `bun run verify` ALL GATES PASSED independently at HEAD
- 2026-08-09 — Pre-M2.1 reconciliation: M1.4→M2.1 transition verified (no M1.5); Testing.md Rust count 56→67; Status/Kanban refreshed to bda811c; worktrees pruned; agent/m1.4-theme deleted (local+remote); feat/m2.1-graphics created (launchpad, no work yet)
- 2026-08-09 — M1.4 shipped to develop (3e0a38e)
- 2026-08-09 — M1-4-Review.md (READY FOR MERGE; native gate SKIPPED — frontend-only delta)
- 2026-08-09 — Wave 0 reconciliation: `bun run verify` ALL GATES PASSED at HEAD; canonical status + this board created
- 2026-08-08 — M1.3 shipped to develop (89e8c8e)
- 2026-08-08 — M1-3-Review.md (READY FOR MERGE)
- 2026-08-08 — M0-4-Verification-Baseline.md marked Superseded

## ⏭️ NEXT ACTION

M2.2 is DONE (merged to develop 1931421). Next: **M2.3 (Animation Engine — timeline, motion manager, transition manager)** — create `feat/m2.3-animation` from develop after a pre-M2.3 baseline reconciliation. Fold deferred M1.4 theme debt (THEME-003 motion, 004 state audit, 005 alias deprecation, 006 extended scales) and remaining graphics debt (M2.1-TEST-001, GFX-002/003/005) into M2.x+ or M9 hardening. Remaining documentation debt: M1.3-DOC-005 (Build.md/ProjectStructure.md counts), DOC-006 (Debug.md/Profiling.md audit), DOC-007 (release wording); DOC-004 partially closed (AGENTS.md inventory + Testing.md count reconciled in 8dd3543).
