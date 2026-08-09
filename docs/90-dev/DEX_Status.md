# DEX — Canonical Status

> Last reconciled: 2026-08-09 (pre-M2.1 reconciliation)
> Commit: a13c836 (`chore: ignore dex.context.xml IDE state`; M1.4 at 3e0a38e)
> Branch: develop (2 ahead of origin/develop — push held by user decision)

## Current

- Phase: Phase 1 — Desktop Shell
- Milestone: M2.1 (next roadmap milestone; not started)
- Status: M1.4 DONE — ready for M2.1
- Branch: develop
- CI: PASS (`bun run verify` 9/9, 2026-08-09); remote run on develop queued at closeout
- Verification: PASS — Vitest 116/116 (16 files: 88 node + 28 jsdom), Rust 67/67, svelte-check 0/0, clippy/build/format/lint PASS
- Native: SKIPPED for M1.4 (frontend-only delta; native gate last run at M1.3 review)

## Milestones

- M0.1 — DONE
- M0.2 — DONE
- M0.3 — DONE
- M0.4 — DONE
- M1.1 — DONE
- M1.2 — DONE
- M1.3 — DONE (acceptance review passed, shipped to develop; residual debts tracked in Kanban)
- M1.4 — DONE (Theme / Visual System — live switching end to end; shipped to develop 3e0a38e)
- M2.1 — TODO (CURRENT)

## Active Work

- None. M1.4 complete; no M2.1 branch/commits yet.

## Blockers

None.

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

- Working tree clean. (Root report deletions committed in `5677097`; `dex.context.xml` untracked + gitignored in `a13c836`.)
- develop is 2 ahead of origin/develop (`5677097` docs, `a13c836` chore) — push held per user decision.
- `agent/m1.4-theme` squash-merged to develop (3e0a38e) — delete local + remote branch.
- 5 older agent worktrees/branches exist, all content merged or superseded:
  - `agent/docs-librarian` (dad9031) — tip in develop history, MERGED — prune.
  - `agent/m1.2-review` (5d133f6) — tip is develop ancestor (M1.1 ship), MERGED — prune.
  - `agent/m1.1-window` (729c966) — IPC wrap folded into 5d133f6; content merged — prune.
  - `agent/m1.3-ui-components` (df10d77) — squash-merged as 89e8c8e — prune.
  - `agent/m1.1-review` (735ffa9) — review content superseded by docs/90-dev/M1-1-Review.md — archive or prune.
- `main` still at `init` — expected per GitWorkflow (main receives milestone/release merges only).

## Next Action

Begin M2.1 (Three.js Core — renderer, scene, camera, lights, per canonical roadmap). Fold deferred M1.4 theme debt into M2.x+ or M9 hardening.

## Last Review

- Wave 0 orientation (4 lanes): docs canon, frontend audit, backend audit, verification baseline — 2026-08-09.
- M1.3 acceptance review: `docs/90-dev/M1-3-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES.
- M1.4 acceptance review: `docs/90-dev/M1-4-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES; native gate skipped (frontend-only delta).
