---
project: omnizya-dex
type: canonical-kanban
authority: project-state
updated: 2026-08-09
---

# DEX — Canonical Engineering Kanban

## 🧭 Current State

- Current Phase: Phase 1 — Desktop Shell
- Current Milestone: M2.1 — next roadmap milestone (not started)
- Branch: develop @ 3e0a38e (in sync with origin/develop)
- Commit: 3e0a38e — feat(theme): ship M1.4 live theme switching end to end
- CI: PASS (`bun run verify` 9/9, 2026-08-09); remote run on develop queued at closeout
- Verification: AUTOMATED VERIFIED — Vitest 116/116 (16 files: 88 node + 28 jsdom), Rust 67/67, svelte-check 0/0, clippy/build/format/lint PASS
- Native Verification: SKIPPED for M1.4 (frontend-only delta; native gate last run at M1.3 review)
- Overall Status: M1.4 DONE — ready for M2.1

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
| M2.1 | Three.js Core (renderer, scene, camera, lights) | TODO | 0% | none |

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

(none — M1.4 complete; no active M2.1 work yet)

---

## 🔍 IN REVIEW

(none)

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

---

## 🔗 ACTIVE WORKTREES

| Worktree | Branch | Purpose | Status |
|---|---|---|---|
| dex-worktrees/docs-librarian | agent/docs-librarian @ dad9031 | M0.4 docs alignment | MERGED (ahead 0, behind 6) — prune |
| dex-worktrees/m1.1-review | agent/m1.1-review @ 735ffa9 | M1.1 review (NEEDS CHANGES) | 1 ahead — reconcile or archive |
| dex-worktrees/m1.1-window | agent/m1.1-window @ 729c966 | M1.1 window work | 5 ahead — verify merge or archive |
| dex-worktrees/m1.2-review | agent/m1.2-review @ 5d133f6 | M1.2 review | MERGED (ahead 0) — prune |
| dex-worktrees/m1.3-ui-components | agent/m1.3-ui-components @ df10d77 | M1.3 primitives | 1 ahead, 1 behind — diff vs 89e8c8e, archive |
| — | agent/m1.4-theme @ 88c60cd | M1.4 theme | SQUASH-MERGED to develop 3e0a38e — delete local + remote branch |

---

## 🧾 RECENT CHANGES

- 2026-08-09 — M1.4 shipped to develop (3e0a38e)
- 2026-08-09 — M1-4-Review.md (READY FOR MERGE; native gate SKIPPED — frontend-only delta)
- 2026-08-09 — Wave 0 reconciliation: `bun run verify` ALL GATES PASSED at HEAD; canonical status + this board created
- 2026-08-08 — M1.3 shipped to develop (89e8c8e)
- 2026-08-08 — M1-3-Review.md (READY FOR MERGE)
- 2026-08-08 — M0-4-Verification-Baseline.md marked Superseded

## ⏭️ NEXT ACTION

Begin M2.1 (Three.js Core — renderer, scene, camera, lights, per canonical roadmap). Deferred M1.4 theme work (M1.4-THEME-003 motion, 004 state audit, 005 alias deprecation, 006 extended scales) folds into M2.x+ or M9 hardening; remaining documentation debt is M1.3-DOC-004…007.
