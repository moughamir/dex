# DEX Design System

## Purpose

Engineering-facing design-system standard for the DEX desktop shell. Read this
before writing any UI. It defines the token architecture, the semantic token
reference, the theme model, the reusable primitives, and the motion and
accessibility rules that keep the shell visually consistent and compositor-safe.

The system lives in `src/lib/ui/`:

- `styles/tokens.css` — the single source of truth for design values
- `themes/*.ts` — programmatic mirror for the graphics engine / JS
- `primitives/` — reusable components (glass, button, badge, separator,
  tooltip, divider)
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
| Primitives | `:root` | raw values: color ramps (aurora, noise), spacing, radii, blur, motion, z-index, shadows, chrome dimensions | no |
| Semantic | `:root` | role mapping for the **default (dark)** theme: surfaces (`--surface-*`), text (`--text-*`), borders (`--border-*`), glass (`--glass-*`, `--glass-border-*`), backdrop (`--bg-*`), HUD/sidebar/dock chrome, focus (`--focus-ring`), selection (`--selection-*`), scrollbars (`--scrollbar-*`). Brand `--dex-*` is reserved for brand/accent only: `--dex-primary`, `--dex-secondary`, `--dex-accent`, `--dex-success`, `--dex-warning`, `--dex-danger`, `--on-primary` | yes |
| Theme overrides | `[data-theme="light"]`, `[data-theme="cyber"]` | override **only** the semantic layer | — |

**The layer rule:** components consume *semantic* tokens for every color and
typography decision. They must never reach for primitives (ramps, alpha
variants) directly. The exceptions are the scale tokens — spacing, radii,
duration, z-index, blur — which are stable by design and may be consumed
directly. **Never hardcode a hex or rgba value in a component.**

Example:

```css
/* correct */
background: var(--surface-1);
border-bottom: 1px solid var(--border-default);

/* wrong */
background: rgba(15, 20, 30, 0.35);
border-bottom: 1px solid rgba(0, 212, 255, 0.2);
```

## Semantic token reference (dark / default)

Values are authoritative for **dark**: the `[data-theme="dark"]` block in
`tokens.css` overrides the `:root` defaults shown below where they differ. The
brand block stays at its `:root` defaults except where a theme overrides it.

| Token | Value | Role |
|---|---|---|
| **Brand (dark)** | | |
| `--dex-primary` | `#5ddcff` | brand primary (dark) |
| `--dex-secondary` | `#00d4ff` | brand secondary (dark) |
| `--dex-accent` | `oklch(0.81 0.13 92)` | brand accent (from `:root`) |
| `--dex-success` | `#32d583` | success state (dark) |
| `--dex-warning` | `#f5b942` | warning state (dark) |
| `--dex-danger` | `#ef4444` | danger state (dark) |
| `--on-primary` | `#05070b` | text on a filled brand surface (dark) |
| **Surfaces** | | |
| `--surface-0` | `rgb(255 255 255 / 0.02)` | faintest fill |
| `--surface-1` | `rgba(15, 20, 30, 0.35)` | panel glass (dark) |
| `--surface-2` | `rgba(15, 20, 30, 0.6)` | elevated glass (dark) |
| `--surface-3` | `rgba(255, 255, 255, 0.08)` | raised fill (dark) |
| `--surface-4` | `rgb(255 255 255 / 0.12)` | highest fill |
| **Text** | | |
| `--text-primary` | `#ffffff` | primary text (dark) |
| `--text-secondary` | `#9ecad8` | secondary text, captions (dark) |
| `--text-muted` | `rgb(160 160 170)` | muted text, status bar |
| `--text-disabled` | `rgb(110 110 120)` | disabled text |
| **Borders** | | |
| `--border-subtle` | `rgb(255 255 255 / 0.05)` | faint hairline |
| `--border-default` | `rgba(0, 212, 255, 0.2)` | prominent hairline (dark) |
| `--border-strong` | `rgb(255 255 255 / 0.15)` | strong hairline |
| **Glass** | | |
| `--glass-light` | `rgb(255 255 255 / 0.05)` | light glass fill |
| `--glass-medium` | `rgb(255 255 255 / 0.08)` | medium glass fill |
| `--glass-heavy` | `rgb(255 255 255 / 0.12)` | heavy glass fill |
| `--glass-ultra` | `rgb(255 255 255 / 0.18)` | ultra glass fill |
| `--glass-border-light` | `rgb(255 255 255 / 0.08)` | faint glass hairline |
| `--glass-border` | `rgb(255 255 255 / 0.12)` | glass hairline |
| `--glass-border-strong` | `rgb(255 255 255 / 0.2)` | strong glass hairline |
| **HUD / sidebar / dock** | | |
| `--hud-bg` | `rgb(15 17 22 / 0.55)` | HUD chrome backdrop |
| `--hud-border` | `rgb(255 255 255 / 0.1)` | HUD hairline |
| `--hud-highlight` | `rgb(255 255 255 / 0.04)` | HUD hover highlight |
| `--sidebar-bg` | `rgb(14 15 18 / 0.7)` | sidebar backdrop |
| `--sidebar-hover` | `rgb(255 255 255 / 0.05)` | sidebar hover |
| `--sidebar-active` | `rgb(255 255 255 / 0.1)` | sidebar active item |
| `--dock-bg` | `rgb(255 255 255 / 0.05)` | dock backdrop |
| `--dock-border` | `rgb(255 255 255 / 0.08)` | dock hairline |
| **Backdrop** | | |
| `--bg-0` | `#05070b` | shell backdrop tint (dark) |
| `--bg-1` | `oklch(0.15 0.01 260)` | backdrop step 1 |
| `--bg-2` | `oklch(0.18 0.015 260)` | backdrop step 2 |
| `--bg-3` | `oklch(0.22 0.015 260)` | backdrop step 3 |
| `--bg-4` | `oklch(0.27 0.015 260)` | backdrop step 4 |
| **Focus** | | |
| `--focus-ring` | `0 0 0 2px rgb(255 255 255 / 0.15), 0 0 0 5px color-mix(in srgb, var(--dex-primary) 55%, transparent)` | keyboard focus ring |
| **Selection** | | |
| `--selection-bg` | `rgba(0, 212, 255, 0.22)` | text selection background (dark) |
| `--selection-text` | `white` | text selection foreground |

CSS-only roles (not mirrored in TS): `--surface-0`, `--surface-4`,
`--text-muted`, `--text-disabled`, `--glass-*`, `--glass-border-*`, `--hud-*`,
`--sidebar-*`, `--dock-*`, `--bg-*`, `--focus-ring`, `--selection-*`,
`--border-subtle`, `--border-strong`, `--scrollbar-*`, `--aurora-*`.

## Scales

### Spacing — `--space-*` (rem)
`1: 0.25` · `2: 0.5` · `3: 0.75` · `4: 1` · `5: 1.25` · `6: 1.5` · `8: 2` ·
`10: 2.5` · `12: 3` · `16: 4`

Prefer the scale over ad-hoc numbers. `gap`, `padding`, `margin` should all come
from it.

### Radii — `--radius-*` (px)
`xs: 6` · `sm: 10` · `md: 14` · `lg: 18` · `xl: 24` · `2xl: 32` · `full: 9999`

Buttons/dock tiles use `md`–`lg`; panels use `lg`; small chrome (tooltips,
chips) uses `sm`.

### Motion — `--duration-*`, `--ease-*`
- `--duration-fast: 120ms` (hover, small state changes)
- `--duration-normal: 220ms` (standard transitions)
- `--duration-slow: 360ms` (bigger reveals)
- `--duration-slower: 600ms` (large, ambient motion)
- `--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1)` — the default easing, ever.
- `--ease-spring: cubic-bezier(0.18, 1.15, 0.3, 1)` (springy entrances)
- `--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)` (soft, longer travel)

### Z-index — `--z-*`
`background: -10` · `content: 1` · `floating: 10` · `sidebar: 20` · `dock: 40` ·
`status: 45` · `hud: 50` · `overlay: 100` · `dialog: 150` · `toast: 200` ·
`tooltip: 300`

Never invent z-index values; always reference a token.

### Layout — HUD chrome dimensions
`--hud-height: 56px` · `--sidebar-width: 280px` · `--sidebar-collapsed-width: 76px` ·
`--dock-height: 76px` · `--status-height: 34px` · `--shell-padding: 32px` ·
`--content-max-width: 1200px` · `--content-gap: 24px` · `--dock-icon: 54px` ·
`--dock-scale: 1.45`

### Glass blur — `--blur-*` (px)
`xs: 2` · `sm: 4` · `md: 8` · `lg: 14` · `xl: 20` · `2xl: 32`

Panels use `backdrop-filter: blur(var(--blur-lg))` and up.

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
import {
  GlassPanel,
  Button,
  Badge,
  Separator,
  Tooltip,
  Divider,
  ViewPlaceholder,
} from "$lib/ui/primitives";
```

### GlassPanel — canonical glass surface
Props: `element?` (`"div" | "section" | "aside" | "nav" | "header" | "footer" | "main"`, default `"div"`),
`variant?` (`"panel" | "hud" | "sidebar" | "dock" | "raised" | "floating"`, default `"panel"`),
`padding?` (`"none" | "sm" | "md" | "lg"`, default `"md"`), `radius?`
(`"md" | "lg" | "xl" | "full"`, default `"xl"`), `glow?: boolean`,
`interactive?: boolean`, `class?: string`, `contentClass?: string`; forwards
rest props (events, id, aria, ...).

```svelte
<GlassPanel variant="raised" glow>
  <h2>Status</h2>
</GlassPanel>
```

### Button
Props: `variant?` (`"primary" | "secondary" | "ghost" | "danger"`, default
`"primary"`), `size?` (`"xs" | "sm" | "md" | "lg" | "xl" | "icon"`, default
`"md"`), `rounded?` (`"sm" | "md" | "lg" | "full"`, default `"lg"`),
`glow?: boolean`, `interactive?: boolean` (default `true`), `loading?: boolean`,
`leftIcon?`/`rightIcon?` (lucide-svelte components), `class?: string`; forwards
native button props (`onclick`, `disabled`, `aria-label`, ...). Uses `cva` +
`twMerge`.

```svelte
<Button variant="primary" onclick={run}>Launch</Button>
<Button variant="ghost" aria-label="Close"><Close /></Button>
```

Icon-only buttons **must** pass `aria-label`.

### Glyphs — lucide-svelte
There is no `Icon` component and no `icons.ts` registry. Glyphs come from
`lucide-svelte`:

```svelte
<script>
  import { Shield, Sparkles } from "lucide-svelte";
</script>

<Shield class="size-4" />
<Sparkles class="size-4" />
```

Do not add an icon library or a local icon registry.

### Tooltip — pure CSS, no floating-ui
Props: `label: string` (required), `side?` (`"top" | "bottom" | "left" | "right"`,
default `"top"`), `class?: string`.

Appears on `:hover` and `:focus-within` (keyboard users get it free). Shows with
a short delay, fades via opacity/transform only, honors
`prefers-reduced-motion`.

```svelte
<Tooltip label="New session">
  <Button variant="ghost" aria-label="New session"><Zap /></Button>
</Tooltip>
```

### Divider
Props: `orientation?` (`"horizontal" | "vertical"`, default `"horizontal"`),
`class?: string`. Renders an `<hr>` with `aria-orientation`.

```svelte
<Divider />
```

## Motion policy

- Durations 120–360ms, token-driven: `--duration-fast` (120ms) for hover and
  small state changes, `--duration-normal` (220ms) as the standard,
  `--duration-slow` (360ms) for bigger reveals. The default easing is
  `var(--ease-standard)`.
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
  `var(--focus-ring)` ring. Never remove focus styles without replacing
  them.
- Tooltips are reachable via keyboard (`:focus-within`).
- Contrast is token-governed: `--text-primary` on `--surface-1` passes AA for
  body copy; muted text (`--text-muted`) is reserved for non-critical chrome
  (status bar). Don't lower text contrast by hand.
- No emojis in UI copy. No invented marketing language — keep copy technical
  and grounded.

## Do / Don't

**Do**
- Use semantic tokens for color and typography: `--surface-*`, `--text-*`,
  `--border-*`, `--glass-*`; brand `--dex-*` for brand/accent only
  (`--dex-primary`, `--dex-accent`, ...).
- Use `GlassPanel` for chrome surfaces; `Button` for actions; lucide-svelte
  for glyphs.
- Keep motion to transform/opacity, 120–360ms, `--ease-standard`.
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
- The mono face — ensure a mono face (`JetBrains Mono` preferred) is available
  at runtime (system font or bundled fontsource); graceful fallbacks are
  already in place.
- `initTheme()` from `core/stores/theme.svelte.ts` must run at boot so the
  `data-theme` attribute is set before first paint.

## Related Documents

- Design tokens and transparency decisions: [`../50-adr/`](../50-adr/)
  (ADR-0003, ADR-0004)
- System architecture: [`../20-architecture/20_System_Architecture.md`](../20-architecture/20_System_Architecture.md)
- Frontend subsystem: [`../20-architecture/21_Frontend.md`](../20-architecture/21_Frontend.md)
- Graphics subsystem: [`../20-architecture/25_Graphics.md`](../20-architecture/25_Graphics.md)
- Theme specification: [`../30-specs/Theme.md`](../30-specs/Theme.md)
- Accessibility standard: [`Accessibility.md`](Accessibility.md)
- Performance standard: [`Performance.md`](Performance.md)
- Coding standards: [`CodingStandards.md`](CodingStandards.md)