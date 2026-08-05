# DEX Design System

## Purpose

Engineering-facing design-system standard for the DEX desktop shell. Read this
before writing any UI. It defines the token architecture, the semantic token
reference, the theme model, the reusable primitives, and the motion and
accessibility rules that keep the shell visually consistent and compositor-safe.

The system lives in `src/lib/ui/`:

- `styles/tokens.css` — the single source of truth for design values
- `themes/*.ts` — programmatic mirror for the graphics engine / JS
- `primitives/` — reusable components (glass, button, icon, tooltip, divider)
- `layout/` — the HUD chrome (topbar, viewport, dock, statusbar)

## Background

DEX is a transparent, GPU-composited shell. Its visual consistency depends on
a single source of truth for design values and a hard rule that components
consume semantic tokens rather than raw values. This standard fixes those
rules so the shell reads as one system rather than a collection of screens.

## Token architecture and the layer rule

Tokens.css is a three-layer CSS custom-property architecture. Plain CSS only —
no preprocessors, no `@apply`, safe to `@import`.

| Layer | Selector | Contents | Themeable? |
|---|---|---|---|
| Primitives | `:root` | raw values: color ramps, alpha variants, fonts, type scale, spacing, radii, motion, z-index, glass blur, chrome dimensions | no |
| Semantic | `:root` | role mapping for the **default (dark)** theme: `--dex-surface-*`, `--dex-text-*`, `--dex-accent*`, `--dex-border*`, `--dex-grid-line`, `--dex-focus-ring`, `--dex-background`, `--dex-on-accent` | yes |
| Theme overrides | `[data-theme="light"]`, `[data-theme="cyber"]` | override **only** the semantic layer | — |

**The layer rule:** components consume *semantic* tokens for every color and
typography decision. They must never reach for primitives (ramps, alpha
variants) directly. The exceptions are the scale tokens — spacing, radii,
duration, z-index, blur — which are stable by design and may be consumed
directly. **Never hardcode a hex or rgba value in a component.**

Example:

```css
/* correct */
background: var(--dex-surface-1);
border-bottom: 1px solid var(--dex-border);

/* wrong */
background: rgba(15, 20, 30, 0.35);
border-bottom: 1px solid rgba(0, 212, 255, 0.2);
```

## Semantic token reference (dark / default)

| Token | Value | Role |
|---|---|---|
| `--dex-surface-1` | `rgba(15, 20, 30, 0.35)` | panel glass |
| `--dex-surface-2` | `rgba(15, 20, 30, 0.6)` | elevated glass (tooltips, modals) |
| `--dex-surface-3` | `rgba(255, 255, 255, 0.08)` | raised fill (dock buttons, chips) |
| `--dex-text-1` | `#ffffff` | primary text |
| `--dex-text-2` | `#9ecad8` | secondary text (captions) |
| `--dex-text-3` | `#8eaab7` | muted text (status bar) |
| `--dex-accent` | `#5ddcff` | brand text / glyphs |
| `--dex-accent-strong` | `#00d4ff` | fills, borders, strong accents |
| `--dex-accent-soft` | `rgba(0, 212, 255, 0.15)` | soft accent fill (hovers, washes) |
| `--dex-border` | `rgba(0, 212, 255, 0.2)` | prominent hairline |
| `--dex-border-subtle` | `rgba(255, 255, 255, 0.06)` | faint hairline |
| `--dex-grid-line` | `rgba(0, 212, 255, 0.05)` | background grid |
| `--dex-focus-ring` | `rgba(0, 212, 255, 0.4)` | keyboard focus ring |
| `--dex-background` | `#05070b` | shell backdrop tint |
| `--dex-on-accent` | `#05070b` | text on a filled accent surface |

CSS-only roles (not mirrored in TS): `--dex-accent-soft`, `--dex-accent-magenta`
(secondary/violet accent, used by the cyber theme), `--dex-border-subtle`,
`--dex-focus-ring`, `--dex-text-3`, `--dex-on-accent`.

## Scales

### Spacing — `--dex-space-*` (px)
`1: 2` · `2: 4` · `3: 8` · `4: 12` · `5: 16` · `6: 20` · `7: 24` · `8: 32` ·
`9: 40` · `10: 48` · `11: 64`

Prefer the scale over ad-hoc numbers. `gap`, `padding`, `margin` should all come
from it.

### Radii — `--dex-radius-*` (px)
`sm: 8` · `md: 12` · `lg: 16` · `xl: 20` · `2xl: 24`

Buttons/dock tiles use `md`–`lg`; panels use `lg`; small chrome (tooltips,
chips) uses `sm`.

### Motion — `--dex-duration-*`, `--dex-ease-out`
- `--dex-duration-fast: 150ms` (hover, small state changes)
- `--dex-duration-base: 200ms` (standard transitions)
- `--dex-duration-slow: 250ms` (bigger reveals)
- `--dex-ease-out: cubic-bezier(.22, .61, .36, 1)` — the only easing, ever.

### Z-index — `--dex-z-*`
`topbar: 100` · `dock: 200` · `statusbar: 300` · `overlay: 400` · `modal: 500` ·
`tooltip: 600`

Never invent z-index values; always reference a token.

### Layout — HUD chrome dimensions
`--dex-layout-topbar: 64px` · `--dex-layout-dock: 72px` ·
`--dex-layout-statusbar: 28px` · `--dex-layout-dock-button: 52px` ·
`--dex-layout-grid: 40px`

### Glass
`--dex-blur-glass: 20px` — the only backdrop blur. Panels use
`backdrop-filter: blur(var(--dex-blur-glass))`.

## Theme model

Themes are **semantic-layer overrides** driven by a `data-theme` attribute on
`<html>`:

```
:root              → dark (default identity)
[data-theme=light] → bright glass
[data-theme=cyber] → electric dark (brighter cyan, violet/magenta hairlines)
```

- CSS owns the switch (`data-theme` on `<html>`).
- `src/lib/core/stores/theme.svelte.ts` manages the attribute, persists the
  choice, and exposes `palette` (the current `ThemePalette`) for JS/GPU.
- `src/lib/ui/themes/{dark,light,cyber}.ts` export `ThemePalette` consts that
  **mirror the resolved semantic values** in tokens.css. The graphics engine
  and any JS that can't read CSS custom properties consumes these strings.

**Sync rule (ADR-0003):** when a semantic value changes in tokens.css, update
the matching palette file in `themes/`. The comment block at the top of
`themes/types.ts` states this. `ThemePalette` carries only what JS/GPU need;
role tokens that stay in CSS are not mirrored.

## Primitives

All primitives: Svelte 5 runes, strict TS, no `any`, real elements with real
semantics. Import them from the barrel:

```ts
import { GlassPanel, Button, Icon, Tooltip, Divider, type IconName } from "$lib/ui/primitives";
```

### GlassPanel — canonical glass surface
Props: `element?` (`"div" | "section" | "aside" | "nav" | "header" | "footer" | "main"`, default `"div"`),
`variant?` (`"panel" | "elevated" | "raised"`, default `"panel"`), `glow?: boolean`,
`class?: string`; forwards rest props (events, id, aria, ...).

```svelte
<GlassPanel variant="elevated" glow>
  <h2>Status</h2>
</GlassPanel>
```

### Button
Props: `variant?` (`"primary" | "ghost" | "glass"`, default `"glass"`),
`size?` (`"sm" | "md" | "lg"`, default `"md"`), `type?` (default `"button"`),
`class?: string`; forwards native button props (`onclick`, `disabled`,
`aria-label`, ...). Uses `cva` + `clsx`.

```svelte
<Button variant="primary" onclick={run}>Launch</Button>
<Button variant="ghost" aria-label="Close"><Icon name="close" /></Button>
```

Icon-only buttons **must** pass `aria-label`.

### Icon + icons registry
`icons.ts` exports static, stroke-based SVG path groups (24px viewBox,
`currentColor`). `IconName = keyof typeof icons`. Available: `home`, `display`,
`file-text`, `zap`, `bot`, `settings`, `close`, `chevron-right`.

Props: `name: IconName`, `size?: number` (default 20), `class?: string`.
Icons are `aria-hidden` — the interactive owner supplies the accessible name.

```svelte
<Icon name="zap" size={24} />
```

To add a glyph: extend `icons.ts` with a stroke-based path string. No icon
library.

### Tooltip — pure CSS, no floating-ui
Props: `label: string` (required), `side?` (`"top" | "bottom" | "left" | "right"`,
default `"top"`), `class?: string`.

Appears on `:hover` and `:focus-within` (keyboard users get it free). Shows with
a 150ms delay, fades via opacity/transform only, honors
`prefers-reduced-motion`.

```svelte
<Tooltip label="New session">
  <Button variant="ghost" aria-label="New session"><Icon name="zap" /></Button>
</Tooltip>
```

### Divider
Props: `orientation?` (`"horizontal" | "vertical"`, default `"horizontal"`),
`class?: string`. Renders an `<hr>` with `aria-orientation`.

```svelte
<Divider />
```

## Motion policy

- Durations 150–250ms, the single easing `var(--dex-ease-out)`.
- **Transform and opacity only.** Never animate layout properties (width,
  height, top, left, margin). This keeps every animation on the compositor.
- Hover *color* changes are implemented as an opacity-faded pseudo-element
  wash (`::before`) — see `Button.svelte` / `Dock.svelte`. Reuse that pattern;
  do not transition `background-color`.
- **Reduced motion:** every interactive component wraps its transitions in
  `@media (prefers-reduced-motion: reduce)` and disables them. Tooltips and
  hovers must not animate when the user prefers reduced motion.
- No scroll-triggered or page-load animation churn in Phase 0. If you add a
  reveal, keep it to one opacity/transform pass.

## Accessibility rules

- Interactive elements are real `<button>`s / `<a>`s — never clickable divs.
- Icon-only controls carry `aria-label` (see Dock, which labels every launcher).
- Icons are `aria-hidden`; the owning control owns the name.
- Keyboard focus is always visible: `:focus-visible` renders the
  `var(--dex-focus-ring)` ring. Never remove focus styles without replacing
  them.
- Tooltips are reachable via keyboard (`:focus-within`).
- Contrast is token-governed: text-1 on surface-1 passes AA for body copy;
  muted text (`text-3`) is reserved for non-critical chrome (status bar).
  Don't lower text contrast by hand.
- No emojis in UI copy. No invented marketing language — keep copy technical
  and grounded.

## Do / Don't

**Do**
- Use `var(--dex-*)` for everything; semantic tokens for color/typography.
- Use `GlassPanel` for chrome surfaces; `Button` for actions; `Icon` for glyphs.
- Keep motion to transform/opacity, 150–250ms, `--dex-ease-out`.
- Label every icon-only control.
- Mirror CSS semantic changes into `themes/*.ts` (ADR-0003).

**Don't**
- Don't hardcode colors, radii, durations, z-index, or spacing numbers.
- Don't import primitives from individual files — use the barrel.
- Don't paint an opaque window background (ADR-0004) — the window is
  transparent; the desktop shows through the glass.
- Don't touch primitive tokens for theme changes — override the semantic layer.
- Don't add icon libraries, floating-ui, or new npm dependencies.

## Wiring

- `src/app.css` must `@import "./lib/ui/styles/tokens.css";` **as its first
  statement** (CSS requires imports before other rules). The global lane owns
  `app.css`; this import is a required handoff.
- The mono face (`--dex-font-sans` falls back to Inter) — ensure a mono face
  (`JetBrains Mono` preferred) is available at runtime (system font or bundled
  fontsource); graceful fallbacks are already in place.
- `initTheme()` from `core/stores/theme.svelte.ts` must run at boot so the
  `data-theme` attribute is set before first paint.

## Related Documents

- Design tokens and transparency decisions: `50-adr/` (ADR-0003, ADR-0004)
- System architecture: `20-architecture/20_System_Architecture.md`
- Frontend subsystem: `20-architecture/21_Frontend.md`
- Graphics subsystem: `20-architecture/25_Graphics.md`
- Theme specification: `30-specs/Theme.md`
- Accessibility standard: `40-engineering/Accessibility.md`
- Performance standard: `40-engineering/Performance.md`
- Coding standards: `40-engineering/CodingStandards.md`