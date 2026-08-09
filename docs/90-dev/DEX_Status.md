# DEX — Canonical Status

> Last reconciled: 2026-08-09 (M2.1 implementation complete → IN REVIEW)
> Commit: e36f6f2 (`feat(graphics): ship M2.1 Three.js core + shell backdrop`, on feat/m2.1-graphics)
> Branch: feat/m2.1-graphics (work branch; develop unchanged @ 408498e)

## Current

- Phase: Phase 1 — Desktop Shell
- Milestone: M2.1 (Three.js Core — implementation complete, IN REVIEW)
- Status: M2.1 IN REVIEW — awaiting independent acceptance (do not mark DONE here)
- Branch: feat/m2.1-graphics @ e36f6f2 (17 files, +1061/−21); develop unchanged @ 408498e
- CI: PASS (`bun run verify` 9/9, 2026-08-09, on feat/m2.1-graphics HEAD)
- Verification: AUTOMATED VERIFIED — Vitest 141/141 (21 files: 94 node + 47 jsdom), Rust 67/67, svelte-check 0/0, clippy/build/format/lint PASS
- Native: NOT VERIFIED — `bun run tauri:dev` desktop gate (transparent/compositor, WebGL in webview) queued for acceptance review

## Milestones

- M0.1 — DONE
- M0.2 — DONE
- M0.3 — DONE
- M0.4 — DONE
- M1.1 — DONE
- M1.2 — DONE
- M1.3 — DONE (acceptance review passed, shipped to develop; residual debts tracked in Kanban)
- M1.4 — DONE (Theme / Visual System — live switching end to end; shipped to develop 3e0a38e)
- M2.1 — IN REVIEW (CURRENT — Three.js Core implementation complete; awaiting independent acceptance)

## Active Work

- M2.1 (Three.js Core) — implementation complete on feat/m2.1-graphics @ e36f6f2, IN REVIEW. Oracle review: READY FOR IN REVIEW (0 Critical/Major; 3 Minor + 3 Nits folded in). Native gate (`bun run tauri:dev`) pending at acceptance.

## Blockers

None. Native verification (transparent/WebGL desktop behavior) requires a Wayland/Hyprland display — queued for the acceptance review.

## Technical Debt

- M1.3 primitives Card/Dropdown/Modal/ContextMenu largely unconsumed by the running app (ThemeSwitcher now consumes Dropdown; rest awaiting Phase 2+ feature surfaces; by design).
- Keyboard-path test gaps for overlay primitives (Shift+F10, Home/End, wrap-around, Tab-close, Modal trap).
- Portal-action duplication (6-line action, extract if a third consumer appears).
- M1.4 deferred theme debt: motion system formalization, component-state consistency audit, legacy token aliases (`--dex-font-size-xs`, `--dex-tracking-wide`), extended typography/width scales (weight/line-height/family/`--type-*`, full `--width-*`).
- Flaky splash handshake (pre-existing, self-healing, out of M1.x scope; track for M9 hardening).

## Documentation Drift

- `AGENTS.md` live-vs-placeholder inventory stale (services/composables implemented; `system/` + `events/emitter.rs` contain real uncompiled code; ADR-0006/0007 refs missing; test count says 56).
- `Build.md` / `ProjectStructure.md` stale counts (from M1.3 review); `Debug.md` / `Profiling.md` unaudited.
- AGENTS.md "no release pipeline yet" wording vs `release.yml` skeleton (packaging exists on tag; publishing deferred to M9.x).
- Closed this pass: architecture status line, Feature Matrix prose, Testing.md counts (all reconciled to M1.4 state).

## Git Hygiene

- feat/m2.1-graphics @ e36f6f2 carries the M2.1 slice (17 files): graphics modules, GraphicsBackdrop + AppShell mount, 5 test files, ADR-0008, docs reconciliations, three@0.185.1 / @types/three@0.185.4 deps. Not merged to develop (acceptance-gated).
- develop unchanged @ 408498e, in sync with origin/develop. b34d267 (docs: refresh canonical state) is a local-only commit ahead of origin.
- `.opencode/` untracked tooling directory (own node_modules/package.json) — excluded from the M2.1 commit.
- 5 stale branches remain as refs only (`agent/docs-librarian`, `agent/m1.1-*`, `agent/m1.3-ui-components`) — content merged or superseded; prune at next cleanup.
- `main` still at `init` — expected per GitWorkflow (main receives milestone/release merges only).

## Next Action

Independent (secondary orchestrator) acceptance review of M2.1 (feat/m2.1-graphics @ e36f6f2): run the `bun run tauri:dev` native gate on Wayland/Hyprland, review the slice, then accept → squash-merge to develop → mark M2.1 DONE. Fold deferred M1.4 theme debt into M2.x+ or M9 hardening.

## Last Review

- M2.1 independent internal review (oracle, 2026-08-09): READY FOR IN REVIEW — 0 Critical/Major; 3 Minor + 3 Nits, all folded into e36f6f2.
- Wave 0 orientation (4 lanes): docs canon, frontend audit, backend audit, verification baseline — 2026-08-09.
- M1.3 acceptance review: `docs/90-dev/M1-3-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES.
- M1.4 acceptance review: `docs/90-dev/M1-4-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES; native gate skipped (frontend-only delta).
