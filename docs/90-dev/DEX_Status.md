# DEX — Canonical Status

> Last reconciled: 2026-08-09 (M2.2 accepted + merged to develop)
> Commit: 1931421 (`feat(graphics): M2.2 effects (bloom, fog, background, grid, particles)`, squash-merge on develop)
> Branch: develop @ 1931421 (origin/develop @ 408498e; local ahead 3)

## Current

- Phase: Phase 2 — Graphics Engine
- Milestone: M2.2 (Effects — DONE); M2.3 (Animation Engine) next, not started
- Status: M2.2 DONE — accepted (3-lane independent review; 2 MAJORs closed + spot re-review READY) and merged to develop
- Branch: develop @ 1931421 (M2.2 squash-merge; 16 files, +1251/−41); origin/develop @ 408498e
- CI: PASS (`bun run verify` 9/9, 2026-08-09, on branch tip pre-merge and develop HEAD post-merge)
- Verification: AUTOMATED VERIFIED — Vitest 160/160 (22 files), Rust 67/67, svelte-check 0/0, clippy/build/format/lint PASS
- Native: PASSED (smoke, 2026-08-09) — debug binary (`cargo build`, no bundler) on real Wayland/sway display: transparent fullscreen window, WebGL scene live. Pixel analysis: corners EXACT match to wallpaper (TL 42,15,69 / TR 22,6,43 / BL 8,5,12 / BR 42,49,130) — transparency preserved with bloom ON, no alpha accumulation; 20.8% of pixels changed between frames 2s apart (particles/fog animating); center distinct from corners (vignette + bloom). Screenshots `/tmp/opencode/m22-native-*.png`.

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
- M2.2 — DONE (Effects — accepted 2026-08-09, merged to develop 1931421)

## Active Work

- M2.2 (Effects) — DONE. Effects subsystem (bloom, fog, background, grid, particles) shipped: compose seam (ComposeContext/RenderCompose) on the renderer; effects/{manager,fog,background,grid,particles,color}.ts + shaders/background.glsl.ts; EFFECTS_CONFIG boot-time toggle; backdrop wiring with GFX-001 (DPR re-arm) + GFX-004 (palette-before-start) folded in. 3-lane independent review (architect, implementation, security): 2 MAJOR (UnrealBloomPass alpha accumulation — ADR-0004 breach, fixed via CustomBlending One/One/Zero/One; backdrop flat-tint vignette — fixed via view-space uFrustumHalf gradient) + minors (compose/dispose exception containment, total parsers, GLRendererLike probes, NoBlending alpha fidelity) — all closed; spot re-review READY. Merged to develop 1931421 (squash). Native gate: PASSED — pixel-corroborated (corners = wallpaper exactly with bloom ON; 20.8% frame animation). `bun run verify` 9/9 pre-merge; Vitest 160/160, Rust 67/67.
- M2.3 (Animation Engine) — not started (next milestone).

## Blockers

None. M2.2 accepted and merged; M2.3 (Animation Engine) not yet started.

## Technical Debt

- M1.3 primitives Card/Dropdown/Modal/ContextMenu largely unconsumed by the running app (ThemeSwitcher now consumes Dropdown; rest awaiting Phase 2+ feature surfaces; by design).
- Keyboard-path test gaps for overlay primitives (Shift+F10, Home/End, wrap-around, Tab-close, Modal trap).
- Portal-action duplication (6-line action, extract if a third consumer appears).
- M1.4 deferred theme debt: motion system formalization, component-state consistency audit, legacy token aliases (`--dex-font-size-xs`, `--dex-tracking-wide`), extended typography/width scales (weight/line-height/family/`--type-*`, full `--width-*`).
- Flaky splash handshake (pre-existing, self-healing, out of M1.x scope; track for M9 hardening).
- M2.1/M2.2 deferred: inert-renderer fallback test (M2.1-TEST-001); `--z-background` token (M2.1-GFX-002); context-loss pause (M2.1-GFX-003); empty-scene 60 fps rAF idle (M2.1-GFX-005). Closed in M2.2: GFX-001 (DPR re-arm), GFX-004 (palette-before-start). Tracked in Kanban TECHNICAL DEBT.

## Documentation Drift

- `AGENTS.md` live-vs-placeholder inventory stale (services/composables implemented; `system/` + `events/emitter.rs` contain real uncompiled code; ADR-0006/0007 refs missing; test count says 56).
- `Build.md` / `ProjectStructure.md` stale counts (from M1.3 review); `Debug.md` / `Profiling.md` unaudited.
- AGENTS.md "no release pipeline yet" wording vs `release.yml` skeleton (packaging exists on tag; publishing deferred to M9.x).
- Closed this pass: architecture status line, Feature Matrix prose, Testing.md counts (all reconciled to M1.4 state); 20_System_Architecture.md graphics prose + ProjectStructure.md graphics section (reconciled to M2.2 live state).

## Git Hygiene

- M2.2 merged to develop as 1931421 (squash of 2 branch commits; 16 files, +1251/−41). feat/m2.2-effects pruned (ref @ ab93156).
- develop @ 1931421, ahead 3 of origin/develop @ 408498e (56f9aa6 M2.1 + 03f0c30 M2.1 docs + 1931421 M2.2). Not pushed (no push requested).
- `.opencode/` untracked tooling directory (own node_modules/package.json) — excluded from the M2.1 commit.
- 5 stale branches remain as refs only (`agent/docs-librarian`, `agent/m1.1-*`, `agent/m1.3-ui-components`) — content merged or superseded; prune at next cleanup.
- `main` still at `init` — expected per GitWorkflow (main receives milestone/release merges only).

## Next Action

M2.2 is DONE (develop 1931421). Next milestone: **M2.3 (Animation Engine — timeline, motion manager, transition manager)**: create `feat/m2.3-animation` from develop after a pre-M2.3 baseline reconciliation; push develop when desired. Fold deferred M1.4 theme debt and remaining graphics debt (M2.1-TEST-001, GFX-002/003/005) into M2.x+ or M9 hardening. Remaining doc debt: M1.3-DOC-005/006/007.

## Last Review

- M2.2 independent internal review (oracle, 2026-08-09): 3-lane (architect, implementation, security) — 2 MAJOR + minors, all closed across fix rounds; spot re-review READY; merged to develop 1931421.
- M2.1 independent internal review (oracle, 2026-08-09): READY FOR IN REVIEW — 0 Critical/Major; 3 Minor + 3 Nits, all folded into e36f6f2.
- Wave 0 orientation (4 lanes): docs canon, frontend audit, backend audit, verification baseline — 2026-08-09.
- M1.3 acceptance review: `docs/90-dev/M1-3-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES.
- M1.4 acceptance review: `docs/90-dev/M1-4-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES; native gate skipped (frontend-only delta).
