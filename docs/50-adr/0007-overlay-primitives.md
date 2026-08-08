# ADR-0007: Overlay Primitives — Floating Positioning, Portals, Translucent Backdrops

- Status: Accepted
- Date: 2026-08-08
- Deciders: Principal Architect
- Scope: The Modal, ContextMenu, and Dropdown primitives in `ui/primitives/` (M1.3 UI Components)

## Context

M1.3 completes the primitive set with three overlay primitives: Modal,
ContextMenu, and Dropdown. Three forces shape how they are built:

1. **GlassPanel is a containing block.** Its surface carries `overflow:
   hidden` and `transform: translateZ(0)` — both establish a new
   containing/stacking context for descendants. An overlay or popover rendered
   *inside* a GlassPanel would be clipped or mis-positioned relative to the
   compositor. Overlays must escape the panel.
2. **The window is transparent (ADR-0004).** The desktop shows through every
   layer of the shell; the HUD chrome already uses translucent glass fills. A
   modal must never dim the shell with an opaque fill — the backdrop has to
   follow the same glass/blur contract as the rest of the chrome.
3. **Dependency discipline (Lightweight Core).** `@floating-ui/dom` is already
   vendored in `package.json` (with `@floating-ui/core`) but currently unused,
   and CodingStandards.md previously forbade floating-ui. ContextMenu and
   Dropdown need collision-aware positioning (flip/shift at window edges) that
   CSS alone cannot provide. Tooltip stays pure CSS and does not need it.

## Decision

1. **D1 — Floating positioning uses the existing `@floating-ui/dom`.**
   ContextMenu and Dropdown position with `computePosition` +
   `autoUpdate`, middleware `offset(8)` / `flip()` / `shift()`, and
   `strategy: "fixed"`. No new positioning dependency is added; `bits-ui` and
   other floating-ui alternatives are rejected. The conflicting "no
   floating-ui" statements in CodingStandards.md and DesignSystem.md are
   reconciled: `@floating-ui/dom` is approved **for popover positioning only**
   (ContextMenu, Dropdown); Tooltip remains pure CSS with no floating-ui.
2. **D2 — Overlay primitives render through a portal to `document.body`.**
   Modal, ContextMenu, and Dropdown mount their overlay surface on
   `document.body` (configurable via Modal's `portalTarget`) to escape
   GlassPanel `overflow: hidden` / `transform` containing blocks. This is
   required, not optional: an overlay mounted inside a glass panel is clipped
   and review-rejectable on sight.
3. **D3 — The Modal backdrop is translucent glass/blur, never an opaque
   dim.** The backdrop uses `backdrop-filter: blur(var(--blur-md))` over a
   translucent fill token — `var(--surface-1)`, which is alpha-translucent in
   every theme (`rgba(15, 20, 30, 0.35)` dark, `rgba(255, 255, 255, 0.45)`
   light, `rgba(8, 12, 24, 0.45)` cyber) — consistent with ADR-0004 and the
   `--z-dialog` (150) layer. An opaque modal backdrop is a contract violation.
   Menus (ContextMenu, Dropdown) surface with the GlassPanel-floating
   treatment at `--z-menu` (110, a new token added to `tokens.css` with M1.3;
   between `--z-overlay` 100 and `--z-dialog` 150 so menus always clear HUD
   chrome and overlays).

## Consequences

- Menus are the only floating-ui consumers; the dependency stays scoped to
  popover positioning and justified (Lightweight Core, PR review).
- Overlays lay out against the root stacking context rather than the panel
  that anchored them; z-index tokens decide stacking deterministically
  (`--z-menu` 110 for menus, `--z-dialog` 150 for modals).
- The desktop stays visible through every layer of the shell, preserving the
  transparent-window aesthetic at every depth (ADR-0004).
- Implementing an overlay inside a glass panel without a portal is now
  review-rejectable on sight (D2).
- A menu opened from within a Modal shares the root stacking context with the
  dialog, so the dialog (150) would cover the menu (110). Menu-inside-dialog
  is out of scope for M1.3; the default `document.body` portal target is
  sufficient until a feature actually needs it.
