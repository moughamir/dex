# DEX — Canonical Status

> Last reconciled: 2026-08-10 (M2.4 accepted + merged to develop)
> Commit: 4d66849 (`feat(graphics): ship M2.4 performance (pool, texture cache, FPS monitor)`, squash-merge on develop)
> Branch: develop @ 4d66849 (origin/develop @ 408498e; local ahead 5)

## Current

- Phase: Phase 2 — Graphics Engine
- Milestone: M2.4 (Performance — DONE); M3.1 (Widget SDK) next, not started
- Status: M2.4 DONE — accepted (implementation review; 2 MAJOR + minors, all closed) and merged to develop
- Branch: develop @ 4d66849 (M2.4 squash-merge; 13 files, +1383/−15); origin/develop @ 408498e
- CI: PASS (`bun run verify` 9/9, 2026-08-10, on branch tip pre-merge and develop HEAD post-merge)
- Verification: AUTOMATED VERIFIED — Vitest 250/250 (34 files), Rust 67/67, svelte-check 0/0, clippy/build/format/lint PASS
- Native: M2.4 is a frontend-only delta — native gate SKIPPED per M1.4 precedent; M2.2 native smoke (pixel-corroborated, `/tmp/opencode/m22-native-*.png`) remains the standing evidence for the transparent window + graphics path.

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
- M2.3 — DONE (Animation Engine — accepted 2026-08-09, merged to develop 43c0e02)
- M2.4 — DONE (Performance — accepted 2026-08-10, merged to develop 4d66849)

## Active Work

- M2.3 (Animation Engine) — DONE. WAAPI-driven engine under `src/lib/ui/motion/` (ADR-0009): token-only durations (`--motion-*` role pairs in tokens.css, mirrored in types.ts and enforced by motion-tokens test), one reduced-motion gate at the manager (DI-injectable matchMedia; production-500 fix — unbound `window.matchMedia` — landed with a bound `.bind(window)`), driver seam (web + test fakes), presets (fade/pop only), timeline (parallel steps, `at` offsets, cancel), transition manager (enter/exit state machine with WeakMap auto-cancel), THEME-TRANSITION root cross-fade (carve-out, both steps `fill: "both"` so the palette swap never flashes at full opacity). Consumers: Modal + Menu enter/exit via transitionManager; Button/NavItem/Card/Tooltip/CursorGlow/splash tokenized transitions; press uses `--motion-press-duration` (cascade-verified: `.dex-interactive:active` transition-duration beats the unlayered reduced-motion net without an `!`). Implementation review (ora-3): 3 MAJOR (press utility `!` beat the reduced-motion net — fixed two-half; theme fade lacked `fill: "both"` — fixed; no reopen-mid-close test — added with cancel-rejecting mock) + minors (applyFinalState edge cases + docstring, Tooltip `--motion-exit-*` vocabulary) — ALL closed; spot re-review READY. Merged to develop 43c0e02 (squash of 3 branch commits). `bun run verify` 9/9 pre- and post-merge; Vitest 205/205 (30 files), Rust 67/67. THEME-003 (motion formalization) CLOSED; M1.4-TEST-001 reduced-motion part CLOSED.
- M2.4 (Performance) — DONE. Three deliverables under `src/lib/graphics/`: GFX-005 (dirty-flag render skip — idle loop keeps scheduling, draws only on dirty/composed — plus lazy `visibilitychange` pause/resume, resume guarded by explicit-stop and reduced-motion, listeners removed in `dispose()`); allocation-free windowed FPS meter (`graphics/fps.ts`, `createFpsMeter`, `meter.reset()` on `startLoop` so visibility gaps never fold into one garbage sample, window-atomic sampling so a throwing subscriber can't corrupt the accumulators) exposed as `subscribeFps` on `GraphicsRenderer` only (not the contracts `Renderer`; inert renderer no-ops); object pool + ref-counted texture cache (`graphics/core/{pool,texture-cache}.ts` — free-list with `max` bounding idle retention, same-`Texture`-instance-per-key with dispose-at-zero, dead LRU machinery removed, `logWarn` never throws); FpsMonitor glass chip (`ui/effects/FpsMonitor.svelte`, tokens-only styling, sibling of the backdrop) wired in GraphicsBackdrop. Implementation review (ora-4): 2 MAJOR (dirty cleared before render → freeze-after-throw; missing `meter.reset()` on restart) + minors (dead LRU, dispose subscriber leak, media-restart-while-hidden, pool drain try/finally, initial>max clamp) — ALL closed. Merged to develop 4d66849 (squash). `bun run verify` 9/9 pre- and post-merge; Vitest 250/250 (34 files), Rust 67/67. GFX-005 CLOSED.
- M3.1 (Widget SDK — registry, metadata, lifecycle) — not started (next milestone).

## Blockers

None. M2.4 accepted and merged; M3.1 (Widget SDK) not yet started.

## Technical Debt

- M1.3 primitives Card/Dropdown/Modal/ContextMenu largely unconsumed by the running app (ThemeSwitcher now consumes Dropdown; rest awaiting Phase 2+ feature surfaces; by design).
- Keyboard-path test gaps for overlay primitives (Shift+F10, Home/End, wrap-around, Tab-close, Modal trap).
- Portal-action duplication (6-line action, extract if a third consumer appears).
- M1.4 deferred theme debt (remaining): component-state consistency audit, legacy token aliases (`--dex-font-size-xs`, `--dex-tracking-wide`), extended typography/width scales (weight/line-height/family/`--type-*`, full `--width-*`). Motion formalization (THEME-003) CLOSED in M2.3.
- Flaky splash handshake (pre-existing, self-healing, out of M1.x scope; track for M9 hardening).
- M2.1/M2.2 deferred: inert-renderer fallback test (M2.1-TEST-001); `--z-background` token (M2.1-GFX-002); context-loss pause (M2.1-GFX-003). Closed in M2.2: GFX-001 (DPR re-arm), GFX-004 (palette-before-start). Closed in M2.4: GFX-005 (dirty-flag render skip + visibility pause). Tracked in Kanban TECHNICAL DEBT.

## Documentation Drift

- `AGENTS.md` live-vs-placeholder inventory stale (services/composables implemented; `system/` + `events/emitter.rs` contain real uncompiled code; ADR-0006/0007/0009 refs missing; test count says 56).
- `Build.md` / `ProjectStructure.md` stale counts (from M1.3 review); `Debug.md` / `Profiling.md` unaudited.
- AGENTS.md "no release pipeline yet" wording vs `release.yml` skeleton (packaging exists on tag; publishing deferred to M9.x).
- Closed this pass: 25_Graphics.md M2.4 section + roadmap mapping reconciled; graphics/README.md M2.4 reality (pool/cache/FPS live, core/ no longer empty); AGENTS.md graphics inventory refreshed (fps.ts, core/{pool,texture-cache}.ts, FpsMonitor, subscribeFps, GFX-005); Feature Matrix M2.4 Built; roadmap M2.4 `[x]`.

## Git Hygiene

- M2.4 merged to develop as 4d66849 (squash; 13 files, +1383/−15). feat/m2.4-performance pruned; worktree `.slim/worktrees/m2.4-performance` removed.
- develop @ 4d66849, ahead 5 of origin/develop @ 408498e (56f9aa6 M2.1 + 03f0c30 M2.1 docs + 1931421 M2.2 + 43c0e02 M2.3 + 4d66849 M2.4). Not pushed (no push requested).
- `.opencode/` untracked tooling directory (own node_modules/package.json) — excluded from the M2.3 commit.
- 5 stale branches remain as refs only (`agent/docs-librarian`, `agent/m1.1-*`, `agent/m1.3-ui-components`) — content merged or superseded; prune at next cleanup.
- `main` still at `init` — expected per GitWorkflow (main receives milestone/release merges only).

## Next Action

M2.4 is DONE (develop 4d66849). Next milestone: **M3.1 (Widget SDK — registry, metadata, lifecycle)**, Phase 3: create `feat/m3.1-widget-sdk` from develop after a pre-M3.1 baseline reconciliation; push develop when desired. Fold remaining deferred theme debt (M1.4-THEME-004/005/006, M1.4-TEST-001 remainder) and graphics debt (M2.1-TEST-001, GFX-002/003) into M3.x+ or M9 hardening. Remaining doc debt: M1.3-DOC-005/006/007.

## Last Review

- M2.4 implementation review (oracle, 2026-08-10): 2 MAJOR (dirty cleared before render → freeze-after-throw; `meter.reset()` missing on loop start → garbage FPS sample after visibility resume) + minors (dead LRU eviction; dispose subscriber leak; media-restart-while-hidden; throwing subscriber accumulator corruption; pool drain try/finally; initial>max clamp) — ALL closed across the fix pass; verdict CHANGES-REQUIRED → resolved; merged to develop 4d66849.
- M2.3 implementation review (oracle, 2026-08-09): 3 MAJOR (press `!` vs reduced-motion net; theme fade `fill`; reopen-mid-close test gap) + minors (applyFinalState edge cases, Tooltip exit vocabulary, docstring over-promise) — ALL closed across the final fix pass; spot re-review READY; merged to develop 43c0e02.
- M2.2 independent internal review (oracle, 2026-08-09): 3-lane (architect, implementation, security) — 2 MAJOR + minors, all closed across fix rounds; spot re-review READY; merged to develop 1931421.
- M2.1 independent internal review (oracle, 2026-08-09): READY FOR IN REVIEW — 0 Critical/Major; 3 Minor + 3 Nits, all folded into e36f6f2.
- Wave 0 orientation (4 lanes): docs canon, frontend audit, backend audit, verification baseline — 2026-08-09.
- M1.3 acceptance review: `docs/90-dev/M1-3-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES.
- M1.4 acceptance review: `docs/90-dev/M1-4-Review.md` — READY FOR MERGE, architect APPROVE WITH MINOR NOTES; native gate skipped (frontend-only delta).
