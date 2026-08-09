# ADR-0003: Design Token Architecture (CSS Custom Properties)

- Status: Accepted
- Date: 2026-08-04
- Deciders: Principal Architect
- Scope: All visual styling; consumed by `ui/`, `features/`, and `graphics/`

## Context

DEX must look like one system, not a pile of components. The live layout
components hardcode hex values (`#5ddcff`, `#8eaab7`, `rgba(15,20,30,.35)`,
`rgba(0,212,255,.2)`, …). The stack lists CSS Variables;
`src/lib/ui/styles/tokens.css` is the source of truth, with TS theme palettes
mirrored in `src/lib/ui/themes/{light,dark,cyber}.ts`.
The graphics engine (Three.js, Phase 2) needs palette values as JS data, not
CSS. Motion is a hard performance contract (60 FPS, GPU compositing).

## Decision

1. **Three token layers, plain CSS custom properties** — one source of truth,
   `src/lib/ui/styles/tokens.css`, is the authoritative vocabulary:
   - *Semantic* (`:root` + `[data-theme='…']`): `--surface-*`, `--text-*`,
     `--border-*`, `--focus-ring`, `--glass-*`, `--blur-*`, `--ease-*`,
     `--duration-*` — the only tokens components consume. Dark is the default
     and lives in `:root`; `light` and `cyber` override the semantic layer
     only.
   - *Brand and accent*: `--dex-*` is reserved for brand/accent values only —
     `--dex-primary/secondary/accent/success/warning/danger/on-primary`.
   - *Component-scoped*: a component may define local aliases deriving from
     semantic tokens (e.g. `--icon-size`) to avoid repeating var() chains.
2. **Theme switching** is a `data-theme` attribute on `<html>`, managed by
   `core/stores/theme.svelte.ts` (rune store; default dark, persisted via
   `core/utils/storage.ts`). CSS does the switching — no inline styles.
3. **Programmatic mirror**: `src/lib/ui/themes/types.ts` defines
   `ThemePalette` (19 fields of concrete string values for the graphics
   engine and JS); `{light,dark,cyber}.ts` export palettes that mirror the
   `data-theme` overrides in `tokens.css` for the same theme. `tokens.css` is
   authoritative for the UI — the semantic vocabulary and the `data-theme`
   overrides both live there; the TS mirror is for programmatic/GPU use. Sync
   rule: changing a token means changing both — review checklist item.
4. **Motion contract**: durations from the `--duration-*` scale
   (`--duration-micro/fast/normal/slow/slower` = 80/120/220/360/600 ms), a
   single DEFAULT easing `--ease-standard`
   (`cubic-bezier(0.2, 0.8, 0.2, 1)`) plus two designated variants:
   `--ease-spring` (`cubic-bezier(0.18, 1.15, 0.3, 1)` — overshoot; hover
   lifts, entrance pops) and `--ease-smooth` (`cubic-bezier(0.4, 0, 0.2, 1)` —
   symmetric; theme cross-fade, expand/collapse). Only `transform`/`opacity`
   are animated (GPU compositor-friendly).
   `prefers-reduced-motion` disables non-essential motion. Z-index comes
   exclusively from the token scale (no magic `z-9999`).
5. **No magic values**: components never hardcode colors, radii, durations, or
   z-index; spacing may use the scale tokens or the spacing scale directly.

## Amendment — THEME-TRANSITION carve-out (2026-08-09, ADR-0009)

The strict single-easing / transform-opacity-only rule above is amended to let
theme switching cross-fade. Rationale: a hard `data-theme` cut is jarring on
large glass surfaces, and the M1.4 theme store applies synchronously before the
next paint.

Theme switching fades the `<html>` root element between palettes: a two-step
opacity timeline (fade-out → swap `data-theme` at the opacity floor → fade-in)
driven by the runtime helper `ui/motion/theme-transition.ts` through the
`--motion-theme-*` mirrored values (`--motion-theme-duration` =
`--duration-slower` 600ms / `--motion-theme-ease` = `--ease-smooth`). Only root
`opacity` is animated — paint-only, never layout properties, never an opaque
full-window overlay (ADR-0004) — and the fade is fully disabled under reduced
motion (switching applies instantly). Known caveat: the pre-existing
unconditional paint transitions in `app.css` (≈ lines 200-212) still fire on
every `data-theme` change outside this fade window; that is pre-existing Phase 0
behavior, not part of this carve-out. See
[ADR-0009](0009-motion-engine.md) and `docs/30-specs/Animation.md`.

## Consequences

- Components become theme-agnostic: restyling DEX = editing token files.
- `graphics/` reads `ThemePalette` for scene colors, keeping WebGL and DOM
  visuals consistent without parsing CSS.
- The dual-source sync rule (CSS ↔ TS) is a small, documented maintenance cost
  accepted in exchange for typed programmatic access.
- Existing hardcoded values in `ui/layout/` migrate to tokens in Phase 0.
