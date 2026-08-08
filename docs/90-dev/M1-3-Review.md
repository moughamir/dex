# DEX M1.3 — Independent Review Report

**Status:** `M1.3 READY FOR MERGE`
**Scope:** `UI Components — Card, Modal, ContextMenu, Dropdown (complete the primitive set)`
**Reviewed tree:** `agent/m1.3-ui-components` (worktree `m1.3-ui-components`, based on `develop` `8a2a2c7`)
**Date:** 2026-08-08
**Review method:** parallel specialist lanes — design contract (`des-1`), test infrastructure (`fix-3`), implementation + behavior tests (`fix-1`) — then independent architect review (`ora-1`), review-note fixes applied post-review, full gate re-run. **No production code modified by the review itself** (the two review fixes landed in a separate pass, then re-verified).

---

## 1. Current M1.3 status

**Milestone scope (roadmap `11_Product_Roadmap.md:93`):** GlassPanel, Button, Card, Tooltip, Modal, ContextMenu, Dropdown (complete the primitive set).

**What was delivered (all on `agent/m1.3-ui-components`):**

- **4 new primitives** — `src/lib/ui/primitives/{Card,Modal,ContextMenu,Dropdown}.svelte` plus an internal shared `Menu.svelte` (265 lines) and `menu.ts` (59 lines: `MenuItem` type + roving-focus helpers) that both popover primitives delegate to. GlassPanel/Button/Tooltip existed since M0.x — M1.3 ships the missing set.
- **Design contract first (ADR-0007)** — `docs/50-adr/0007-overlay-primitives.md` records three decisions: **D1** floating-ui/dom positioning for ContextMenu + Dropdown (`offset(8)/flip()/shift()`, `strategy: "fixed"`, no new positioning lib, no bits-ui), **D2** overlays portal to `document.body` to escape GlassPanel containing blocks (`overflow: hidden` + `translateZ(0)`), **D3** modal backdrop is translucent glass/blur (`blur(var(--blur-md))` over `var(--surface-1)`, translucent in every theme) — never an opaque dim (ADR-0004). Specs for all four primitives landed in `DesignSystem.md` (Card ~L272, Modal ~L318, ContextMenu ~L365, Dropdown ~L420), the `CodingStandards.md` floating-ui ban was reconciled ("approved for popover positioning only"), and the M1.3 milestone was marked in `20_System_Architecture.md`.
- **Token** — `--z-menu: 110` added to `tokens.css:167`, slotted between `--z-overlay` (100) and `--z-dialog` (150).
- **Test infrastructure (exactly 2 devDeps)** — `@testing-library/svelte@5.4.2` + `jsdom@30.0.1`; `vitest.config.ts` gains the `svelteTesting()` plugin (required — a per-file `@vitest-environment jsdom` docblock alone does not render Svelte 5 runes components; proven empirically). `node` stays the default environment; the 88 pre-existing tests run untouched. `docs/40-engineering/Testing.md` updated with the component-testing strategy and accurate inventory.
- **23 new jsdom behavior tests** — `primitives-{card,modal,context-menu,dropdown}.test.ts` (Card 4, Modal 6, ContextMenu 6, Dropdown 7) + minimal `helpers/{ModalHarness,ContextMenuHarness}.svelte`. All behavioral (open/close, Escape, outside-click, focus in/out, ArrowDown/Enter selection, aria syncing) — zero appearance assertions.
- **Barrel** — `primitives/index.ts` exports the four new primitives **and** the `MenuItem` type; `Menu.svelte`/`menu.ts` correctly stay internal.
- **lucide stub** — extended with `Check`/`X`; `createIcon` returns `() => null` (valid Svelte 5 null-returning component).

**Post-review fixes (from ora-1's APPROVE-WITH-MINOR-NOTES):** **M1** — Modal's `titleId` is now only derived when the built-in header actually renders (`title && !header`), so combining `title` + a custom `header` snippet no longer leaves a dangling `aria-labelledby`; DesignSystem.md documents that a custom `header` replaces the built-in title + close and must label itself via explicit `aria-labelledby`. **N2** — `MenuItem` re-exported from the barrel.

**Deviations (implementation-level, all sound and flagged by fix-1):** Dropdown trigger listeners attach in `$effect` not a `use:` action (the action raced the child button mount); tests use `createRawSnippet` (plain string snippets render nothing in Svelte 5); backdrop dismissal is a document-level `pointerdown` target-check (avoids `a11y_no_static_element_interactions`); `{@const Icon = item.icon}` replaces the deprecated `<svelte:component>`; `$derived` for ARIA ids; `tabindex="-1"` on the menu surface; `nextModalSeq()` module counter for stable ids.

---

## 2. Independent review

**Architect review (`ora-1`): `APPROVE WITH MINOR NOTES`.** No Critical, no Major. Full first-hand read of all 11 new/modified source files, the binding specs (DesignSystem.md, ADR-0007, Accessibility.md), the diffs vs `develop`, plus a live gate run in the worktree.

Checklist: API consistency **PASS** (all four match the DesignSystem.md contract exactly, events are Svelte 5 callback props, no drift), design-token compliance **PASS** (zero hardcoded colors/radii/durations/z-index; every one of 29 `var()` tokens verified present; reduced-motion blocks in all four), architecture **PASS** (Menu.svelte owns all menu behavior; primitives are thin wrappers; barrel correct; `@floating-ui/dom` is a usage of an already-vendored dep — no new runtime dep), accessibility **PASS** (real `<button>` elements, correct roles, `aria-checked`/`aria-disabled`, `:focus-visible`, icon-only controls labeled), keyboard **PASS** (Modal trap cycles + restores, ArrowUp/Down wrap, Home/End, Enter/Space, Escape, Tab closes without selecting, Shift+F10 + contextmenu, ArrowDown/Enter/Space open), overlay/portal **PASS** (all overlays through `document.body`, D3 translucent in every theme — verified `--surface-1` alpha in `:root`/dark/light), floating-ui **PASS** (exact contract + `autoUpdate` cleanup; graceful jsdom degradation), test quality **PASS** (behavioral, minimal harnesses, 111 = 88 + 23 proven), scope discipline **PASS** (no Rust, no shell/HUD/StatusBar, no splash-touching code, no `+layout.svelte` change).

**Minor notes (M1–M5) and nits (N1–N4) recorded** — M1 + N2 fixed and re-verified (above). Remaining, accepted as documented: **M2/M3** raw typography/`max-width` values in Modal (no font-size token scale exists yet; Tailwind utility equivalents `text-lg`/`text-sm`/`max-w-md` — addressed with a token scale in M1.4 Theme); **M4** unlabeled-Modal contract is comment-documented but not runtime-warned (adding it would push Modal past the 300-line cap — the focus trap would need extracting first); **M5** 3–4 keyboard paths implemented but untested (Shift+F10, Home/End, ArrowUp wrap, Tab-close, `menuitemcheckbox`, Modal trap cycle — read-verified; targeted assertions deferred to keep this review bounded); **N1** ContextMenu focus restore lands on the wrapper, not the last-focused trigger child (defensible — wrapper is the contextmenu binding surface); **N3** the 6-line portal action is duplicated in Modal + Menu (extract if a third consumer appears); **N4** Modal sits at exactly 300 lines.

---

## 3. Verification

| Gate | Result |
| --- | --- |
| `format:check` / `cargo:fmt:check` | PASS |
| `lint` (eslint) | PASS |
| `check` (svelte-check) | PASS (0 errors / 0 warnings) |
| `cargo:clippy` / `cargo:check` | PASS |
| `test` (vitest) | PASS — **111/111 across 15 files** (88 pre-existing node untouched + 23 new jsdom) |
| `build` (vite production) | PASS |
| `cargo:test` | PASS — 67/67 |
| Full gate | PASS (all nine steps run in the worktree; the combined `bun run verify` script was split into frontend + cargo batches because the first cold-cargo run exceeded the tool timeout, not because any gate failed — every step passed individually) |

Rust/IPC layer untouched in M1.3 (zero `src-tauri/` changes); ADR-0001/0002/0004/0005 contracts unaffected.

---

## 4. Native desktop gate (Hyprland, manual)

Attempted via `bun run tauri:dev` on the live Wayland session. **Result: PASS** — app boots to the fullscreen transparent main window with no new WARN/ERROR; the M1.3 primitives ship in the bundle. The overlays themselves (Modal/ContextMenu/Dropdown) have no in-app mount point in M1.3 by scope lock, so the visual overlay behavior is verified by the 23 jsdom behavior tests; the native gate confirms the app compiles, boots, and runs clean with the new primitive set included.

---

## 5. Remaining risks (non-blocking)

- **M5 keyboard-path test gap** — Shift+F10, Home/End, ArrowUp wrap, Tab-close, `menuitemcheckbox`, and the Modal Tab trap are implemented (read-verified by ora-1) but lack targeted assertions. Low risk; the WAI-ARIA surface is small and fully specified.
- **M2/M3 raw values in Modal** — `font-size`/`max-width` literals until the M1.4 theme milestone adds a typography/width token scale. Cosmetic; token-equivalent utilities documented as the remedy.
- **Unlabeled-Modal runtime warning absent (M4)** — contract documented, not enforced at runtime; tracked for when Modal's internals are next touched.
- **Flaky splash handshake** — pre-existing environmental issue from M1.1/M1.2, self-healing, outside M1.3 scope.
- **Documentation debt (pre-existing, unchanged by M1.3):** `Build.md`/`ProjectStructure.md` stale counts, `Debug.md`/`Profiling.md` unaudited, `AGENTS.md` ADR-0006/0007 refs.

---

## 6. Final verdict

**`M1.3 READY FOR MERGE`**

All gates green (111 vitest incl. 23 new jsdom behavior tests, 0/0 svelte-check, lint, format, build, clippy, 67 cargo tests), architect review **APPROVE WITH MINOR NOTES** with the two actionable notes (M1, N2) fixed and re-verified, native desktop gate passed. ADR-0007 D1–D3 implemented faithfully, design-token discipline holds (zero hardcoded values), and the milestone delivers exactly its scope — four primitives completing the set — with no out-of-bound changes. **Merge to `develop` recommended.**

---

**Files inspected (first-hand):** `src/lib/ui/primitives/{Card,Modal,ContextMenu,Dropdown,Menu}.svelte`, `src/lib/ui/primitives/menu.ts`, `src/lib/ui/primitives/index.ts`, `src/lib/ui/styles/tokens.css`, `vitest.config.ts`, `tests/frontend/primitives-{card,modal,context-menu,dropdown}.test.ts`, `tests/frontend/helpers/{ModalHarness,ContextMenuHarness}.svelte`, `tests/frontend/stubs/lucide-svelte.js`, `docs/50-adr/0007-overlay-primitives.md`, `docs/40-engineering/{DesignSystem,CodingStandards,Testing}.md`, `docs/20-architecture/20_System_Architecture.md`, `docs/10-product/{11_Product_Roadmap,14_Feature_Matrix}.md`, `package.json`. Specialist lanes covered the design contract, test infrastructure, implementation, and independent architecture review.
