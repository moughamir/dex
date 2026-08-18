# DEX M1.4 — Independent Review Report

**Status:** `M1.4 READY FOR MERGE`
**Scope:** `Theme — dark, cyber, dynamic; live switching end to end`
**Reviewed tree:** `agent/m1.4-theme` (based on `develop` `89e8c8e`)
**Date:** 2026-08-09
**Review method:** parallel specialist lanes — design/contract docs (`des-1`) + implementation + behavior tests (`fix-1`) — then independent architect review (`ora-1`), review fixes applied, full gate re-run. **No production code modified by the review itself** (the two review fixes landed in a separate pass, then re-verified).

---

## 1. Contract (reconciled from canonical sources)

**Milestone scope (roadmap `11_Product_Roadmap.md:95`):** M1.4 Theme — dark, cyber, dynamic; live switching end to end. PRD **TH-2**: switch themes at runtime, applied before the next paint, persisted across sessions. Contract: `docs/30-specs/Theme.md`.

**Contract decisions (recorded before implementation):**

- **D1 — "dynamic" = TH-2 live runtime switching.** The term appears only in the roadmap/feature matrix; no spec, story, or architecture doc defines a fourth mode. The Theme spec enumerates exactly three built-ins (dark, light, cyber) and the user-story AC is "applies before next paint and persists". Resolution: **no system-follow mode**; three built-in themes, live switching end to end. Recorded in `Theme.md` switching-contract section.
- **D2 — typography token scale.** `--font-size-*` (xs .75 / sm .875 / md 1 / lg 1.125 / xl 1.25 / 2xl 1.5 rem) in `tokens.css`. Resolves the M1.3 carry-forward **M2/M3** (raw font-size values in Modal), explicitly assigned to M1.4 by the M1.3 review.
- **D3 — modal width token.** `--modal-max-width: 28rem` in the chrome-dimensions cluster (resolves the M1.3 **M3** max-width debt).
- **D4 — ThemeSwitcher.** Dropdown-based HUD control mounted in the TopBar actions cluster; trigger shows the current theme name; `selected`/`onSelect` bound to the theme store.

**Explicit non-goals:** no Rust/IPC changes; no new theme modes; no system-follow; no settings page (M5.6); no splash/FOUC rework; no M1.5; no test-infra migration.

## 2. What was delivered (all on `agent/m1.4-theme`)

- **Tokens** — `tokens.css`: "Font sizes" scale block (6 tokens) between Spacing and Shadows; `--modal-max-width: 28rem` in the chrome dims. Legacy `--dex-*` aliases and all `[data-theme=...]` blocks untouched.
- **Modal.svelte** — exactly three token substitutions (title `--font-size-lg`, description `--font-size-sm`, surface `--modal-max-width`); resolved values identical, zero visual delta.
- **ThemeSwitcher.svelte** (new, 25 lines) — `labelOf satisfies Record<ThemeName, string>`; items derived from the themes config in key order (dark, cyber, light); `selected={themeStore.current}`, `onSelect` applies via the store; zero styles, zero hardcoded values, no `any`.
- **TopBar.svelte** — `<ThemeSwitcher />` rendered in the actions cluster (purely additive); `layout/index.ts` barrel export added (review fix M1).
- **Tests** — `tests/frontend/theme-switcher.test.ts` (new, 5 jsdom behavior tests): trigger accessible name + `aria-haspopup`; menu lists Dark/Cyber/Light in config order; end-to-end Light apply (store + `documentElement.dataset.theme` + menu close); selected item as checked `menuitemradio`; Escape closes + focus restore. Follows the established `primitives-dropdown.test.ts` pattern; `beforeEach` resets the store.
- **Docs** — `DesignSystem.md` (Font sizes scale, `--modal-max-width`, ThemeSwitcher spec, Modal token note, primitives layer table gains typography — review fix N1), `Theme.md` (D1 record), `11_Product_Roadmap.md` (M1.4 `[x]`), `14_Feature_Matrix.md` (Theme row → Built + stale "M1.3 is next" prose fixed), `20_System_Architecture.md` (M1.4 complete line), `Testing.md` (frontend inventory refreshed: 16 files / 116 tests = 88 node + 28 jsdom).

## 3. Independent review

**Architect review (`ora-1`): `APPROVE WITH MINOR NOTES`.** No Critical, no Major. Full first-hand read of the complete M1.4 diff vs `89e8c8e` (src, tests, docs), plus re-verification runs of the new and existing theme tests (11/11).

Checklist: contract fidelity **PASS** (exactly the six deliverables, no scope creep, no Rust/deps/package.json), token discipline **PASS** (values byte-exact, right locations, no hardcoded values in new code), architecture **PASS** (ThemeSwitcher = thin config over Dropdown + themeStore; ADR-0003 intact — CSS owns switching, palette mirror untouched and still in sync), accessibility/keyboard **PASS** (real button trigger, `aria-haspopup`/`aria-expanded`, `menuitemradio` + `aria-checked`, ArrowDown/Enter/Space open, Escape close + focus restore), tests **PASS** (behavioral, no appearance assertions, each traced to implementation), docs **PASS** (accurate vs implementation and tokens.css; roadmap/matrix correct), regressions **PASS** (TopBar additive, Modal token-equivalent).

**Minor (M1) and nit (N1) fixed and re-verified:** M1 — ThemeSwitcher added to the layout barrel (`index.ts`); N1 — DesignSystem layer table now lists typography among primitives. **Accepted as documented:** N2 — legacy `--dex-font-size-xs` alias coexists with the new scale (pre-existing; migration tracked in Kanban M1.4-THEME-005); N3 — M1-3-Review.md carries no resolution marker (historical record left as-is).

## 4. Verification

| Gate | Result |
| --- | --- |
| `format:check` / `cargo:fmt:check` | PASS |
| `lint` (eslint) | PASS |
| `check` (svelte-check) | PASS (0 errors / 0 warnings) |
| `cargo:clippy` / `cargo:check` | PASS |
| `test` (vitest) | PASS — **116/116 across 16 files** (88 pre-existing node untouched + 28 jsdom incl. 5 new) |
| `build` (vite production) | PASS |
| `cargo:test` | PASS — **67/67** |
| Full gate | PASS — `bun run verify` then `bun run cargo:test`, both exit 0 at final HEAD |

Rust/IPC layer untouched in M1.4 (zero `src-tauri/` changes); ADR-0001/0002/0004/0005/0006/0007 contracts unaffected.

## 5. Native desktop gate

**SKIPPED — no native/runtime behavior change.** M1.4 is frontend-only: token additions, one new component, one additive mount, docs. Per the milestone rule, native verification runs only when the milestone changes native/runtime behavior; the M1.3 native PASS (manual Wayland/Hyprland `tauri:dev`) stands and M1.4 introduces no Rust or window-layer change.

## 6. Remaining risks and deferred debt (non-blocking)

- **Kanban M1.4-THEME-003/004/005 (deferred by scope lock):** motion-system formalization, component-state consistency audit, and legacy `--dex-*` alias deprecation were listed on the project Kanban as aspirational M1.4 cards; the roadmap contract names only live theme switching, so they are recorded as deferred debt rather than shipped half-built.
- **Kanban M1.4-TEST-001 (partial):** ThemeSwitcher switching behavior is tested; reduced-motion and token-resolution assertions remain deferred with the motion/state cards.
- **M1.3-TEST-001/002:** overlay-primitive keyboard-path test gaps (Shift+F10, Home/End, wrap, Tab-close, modal trap) and the unlabeled-Modal runtime warning — unchanged, still tracked.
- **M1.3-DOC-004/005/006/007:** AGENTS.md live-vs-placeholder inventory, Build.md/ProjectStructure.md counts, Debug.md/Profiling.md audit, release-pipeline wording — pre-existing documentation debt outside M1.4 scope, unchanged.
- **M1.1-WIN-001:** splash handshake flakiness — pre-existing, self-healing, out of M1.x scope.
- **DEX_Status/Kanban** updated at closeout to reflect the delivered state (untracked project-state docs, as created by the Wave 0 ritual).

## 7. Final verdict

**`M1.4 READY FOR MERGE`**

All gates green (116 vitest incl. 5 new jsdom behavior tests, 0/0 svelte-check, lint, format, build, clippy, 67 cargo tests), architect review **APPROVE WITH MINOR NOTES** with the two actionable notes (M1, N1) fixed and re-verified. The milestone delivers exactly its roadmap scope — live theme switching end to end across the three built-in themes, persisted and applied before next paint — resolves the M1.3 M2/M3 carry-forward with a proper typography/width token scale, and adds no out-of-bound changes. Native gate skipped with justification (frontend-only delta). **Merge to `develop` recommended.**

---

**Files inspected (first-hand by ora-1):** `src/lib/ui/styles/tokens.css`, `src/lib/ui/primitives/Modal.svelte`, `src/lib/ui/layout/{ThemeSwitcher,TopBar,index}.ts/.svelte`, `tests/frontend/theme-switcher.test.ts`, `src/lib/core/stores/theme.svelte.ts`, `src/lib/core/config/theme.ts`, `src/lib/ui/primitives/{Dropdown,Menu,Button}.svelte`, `docs/40-engineering/{DesignSystem,Testing}.md`, `docs/30-specs/Theme.md`, `docs/10-product/{11_Product_Roadmap,14_Feature_Matrix}.md`, `docs/20-architecture/20_System_Architecture.md`, `docs/90-dev/M1-3-Review.md`. Specialist lanes covered the docs contract, implementation + tests, and independent architecture review.
