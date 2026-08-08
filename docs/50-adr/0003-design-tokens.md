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
   (`--duration-fast/normal/slow/slower` = 120/220/360/600 ms), single easing
   `--ease-standard` (`cubic-bezier(0.2, 0.8, 0.2, 1)`), only
   `transform`/`opacity` animated (GPU compositor-friendly).
   `prefers-reduced-motion` disables non-essential motion. Z-index comes
   exclusively from the token scale (no magic `z-9999`).
5. **No magic values**: components never hardcode colors, radii, durations, or
   z-index; spacing may use the scale tokens or the spacing scale directly.

## Consequences

- Components become theme-agnostic: restyling DEX = editing token files.
- `graphics/` reads `ThemePalette` for scene colors, keeping WebGL and DOM
  visuals consistent without parsing CSS.
- The dual-source sync rule (CSS ↔ TS) is a small, documented maintenance cost
  accepted in exchange for typed programmatic access.
- Existing hardcoded values in `ui/layout/` migrate to tokens in Phase 0.
