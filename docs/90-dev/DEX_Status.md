# DEX — Canonical Status

> Last reconciled: 2026-08-09 (M2.1 accepted + merged to develop)
> Commit: 56f9aa6 (`feat(graphics): ship M2.1 Three.js core + shell backdrop`, squash-merge on develop)
> Branch: develop @ 56f9aa6 (origin/develop @ 408498e; local ahead 2)

## Current

- Phase: Phase 2 — Graphics Engine
- Milestone: M2.1 (Three.js Core — DONE); M2.2 (Effects) next, not started
- Status: M2.1 DONE — accepted (4-lane independent review, 0 Critical/Major) and merged to develop
- Branch: develop @ 56f9aa6 (M2.1 squash-merge; 22 files, +1113/−58); origin/develop @ 408498e
- CI: PASS (`bun run verify` 9/9, 2026-08-09, on develop HEAD pre- and post-merge)
- Verification: AUTOMATED VERIFIED — Vitest 141/141 (21 files: 94 node + 47 jsdom), Rust 67/67, svelte-check 0/0, clippy/build/format/lint PASS
- Native: PASSED (smoke, 2026-08-09) — `bun run tauri:dev` on real Wayland/Hyprland display: app builds+runs, fullscreen transparent window (fullscreen:2, visible), WebGL scene live+animating, zero errors/panics in log. Pixel analysis at acceptance (2026-08-09): no solid fill (corners show wallpaper through), center scene region distinct + changes across frames. Screenshots `/tmp/opencode/dex-native-*.png`.

## Milestones

- M0.1 — DONE
- M0.2 — DONE
- M0.3 — DONE
- M0.4 — DONE
- M1.1 — DONE
- M1.2 — DONE
- M1.3 — DONE (acceptance review passed, shipped to develop; residual debts tracked in Kanban)
- M1.4 — DONE (Theme / Visual System — live switching end to end; shipped to develop 3e0a38e)
- M2.1 — DONE (Three.js Core — accepted 2026-08-09, merged to develop 56f9aa6)

## Active Work

- M2.1 (Three.js Core) — DONE. 4-lane independent review (architect, implementation, security, docs): READY FOR IN REVIEW, 0 Critical/Major; consensus one-liners folded (3ea9321: resize zero-guard, reduced-motion re-render, tick termination guard, pointer-events-none, contracts doc). Merged to develop 56f9aa6 (squash). Native gate: PASSED (smoke) + pixel-corroborated. `bun run verify` 9/9 pre- and post-merge.
- M2.2 (Effects) — not started (next milestone).

## Blockers

None. M2.1 accepted and merged; M2.2 (Effects) not yet started.

## Technical Debt

- M1.3 primitives Card/Dropdown/Modal/ContextMenu largely unconsumed by the running app (ThemeSwitcher now consumes Dropdown; rest awaiting Phase 2+ feature surfaces; by design).
- Keyboard-path test gaps for overlay primitives (Shift+F10, Home/End, wrap-around, Tab-close, Modal trap).
- Portal-action duplication (6-line action, extract if a third consumer appears).
- M1.4 deferred theme debt: motion system formalization, component-state consistency audit, legacy token aliases (`--dex-font-size-xs`, `--dex-tracking-wide`), extended typography/width scales (weight/line-height/family/`--type-*`, full `--width-*`).
- Flaky splash handshake (pre-existing, self-healing, out of M1.x scope; track for M9 hardening).
- M2.1 deferred: inert-renderer fallback test (M2.1-TEST-001); DPR re-query (M2.1-GFX-001); `--z-background` token (M2.1-GFX-002); context-loss pause (M2.1-GFX-003); palette-before-start ordering (M2.1-GFX-004); empty-scene 60 fps rAF idle (M2.1-GFX-005). Tracked in Kanban TECHNICAL DEBT.

## Documentation Drift

- `AGENTS.md` live-vs-placeholder inventory stale (services/composables implemented; `system/` + `events/emitter.rs` contain real uncompiled code; ADR-0006/0007 refs missing; test count says 56).
- `Build.md` / `ProjectStructure.md` stale counts (from M1.3 review); `Debug.md` / `Profiling.md` unaudited.
- AGENTS.md "no release pipeline yet" wording vs `release.yml` skeleton (packaging exists on tag; publishing deferred to M9.x).
- Closed this pass: architecture status line, Feature Matrix prose, Testing.md counts (all reconciled to M1.4 state).

## Git Hygiene

- M2.1 merged to develop as 56f9aa6 (squash of 6 branch commits; 22 files, +1113/−58). feat/m2.1-graphics ref @ decfd45 retained until report; origin/feat/m2.1-graphics unchanged.
- develop @ 56f9aa6, ahead 2 of origin/develop @ 408498e (b34d267 docs refresh + 56f9aa6 M2.1). Not pushed (no push requested).
- `.opencode/` untracked tooling directory (own node_modules/package.json) — excluded from the M2.1 commit.
- 5 stale branches remain as refs only (`agent/docs-librarian`, `agent/m1.1-*`, `agent/m1.3-ui-components`) — content merged or superseded; prune at next cleanup.
- `main` still at `init` — expected per GitWorkflow (main receives milestone/release merges only).

## Next Action

M2.1 is DONE (develop 56f9aa6). Next milestone: **M2.2 (Effects — bloom, fog, background, grid, particles)**: create `feat/m2.2-effects` from develop after a pre-M2.2 baseline reconciliation; push develop when desired. Fold deferred M1.4 theme debt and M2.1 debt into M2.x+ or M9 hardening. Remaining doc debt: M1.3-DOC-005/006/007.

## Last Review

- M2.1 independent internal review (oracle, 2026-08-09): READY FOR IN REVIEW — 0 Critical/Major; 3 Minor + 3 Nits, all folded into e36f6f2.
- Wave 0 orientation (4 lanes): docs canon, frontend audit, backend audit, verification baseline — 2026-08-09.
- M1.3 acceptance review: `docs/90-dev/M1-3-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES.
- M1.4 acceptance review: `docs/90-dev/M1-4-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES; native gate skipped (frontend-only delta).
