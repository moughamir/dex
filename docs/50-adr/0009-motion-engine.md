# ADR-0009: DOM Motion Engine (Web Animations API)

- Status: Accepted
- Date: 2026-08-09
- Deciders: Principal Architect
- Scope: The `ui/motion/` module (M2.3 Animation Engine) and the motion token
  vocabulary; amends ADR-0003 §4

## Context

M2.3 ships the Animation Engine (timeline, motion manager, transition manager,
per `11_Product_Roadmap.md`). Phase 0/1 established two hard constraints that
frame the decision:

1. **One frame-loop owner.** ADR-0008 gives the `graphics/` renderer the sole
   `requestAnimationFrame` loop. A second continuous loop (or per-animation
   rAF scheduling) would fight the renderer for frames, complicate reduced
   motion, and add a second clock to reason about.
2. **Compositor-only motion.** ADR-0003 caps animation at
   `transform`/`opacity` on the GPU-composited property set, with durations
   from the `--duration-*` scale and a single default easing.
3. **Theme switching must stay live and smooth.** The M1.4 theme store applies
   `data-theme` synchronously before the next paint. A hard cut is jarring on
   large glass surfaces; a cross-fade needs a narrowly scoped exception to the
   ADR-0003 single-easing and transform/opacity-only rules.

The shell is a SvelteKit SPA whose UI chrome is plain DOM. JS-orchestrated
sequences could be hand-rolled with rAF (rejected: second loop), or driven by
the platform's own animation engine.

## Decision

1. **D1 — The Web Animations API is the DOM motion engine.** `ui/motion/`
   drives JS-orchestrated sequences through `Element.animate` behind a driver
   seam (`driver.ts`). The engine is rAF-free: no module under `ui/motion/`
   may schedule frames — the renderer stays the sole continuous-loop owner
   (ADR-0008). Interaction states (hover, press, focus) stay
   CSS-transition-driven via the `--motion-*` role tokens; WAAPI is for
   enter/exit, timelines, and JS-orchestrated sequences only.
2. **D2 — Token-only public API.** The public API accepts `DurationToken` /
   `EaseToken` (mirrors of `--duration-*` / `--ease-*` in `tokens.css`, kept
   in sync by the motion-tokens test) and never raw numbers or bezier strings.
   `types.ts` holds the mirrors; `presets.ts` is the only source of keyframes
   (transform/opacity only); consumers write neither.
3. **D3 — One reduced-motion gate at the manager.** `MotionManager` lazily
   wires a `prefers-reduced-motion` listener (DI-injectable `matchMedia`,
   null-safe → `reduced=false` when absent, mirroring the renderer). Under
   reduced motion `animate()` returns an already-finished handle and
   synchronously places the element at the keyframes' final state — enter
   lands fully visible, exit fully hidden — without reaching the driver;
   `transitionManager.exit()` runs `onDone` immediately;
   `transitionTheme()` applies instantly. The CSS layer keeps its own
   `@media (prefers-reduced-motion: reduce)` safety net for transition-driven
   states.
4. **D4 — THEME-TRANSITION carve-out (amends ADR-0003 §4).** Theme switching
   fades the `<html>` root element with a two-step opacity timeline
   (`slower`/`smooth`) driven by the runtime helper `theme-transition.ts`:
   fade-out → swap `data-theme` (and palette) at the opacity floor → fade-in.
    Only root `opacity` is animated — never layout properties, never an opaque
    full-window overlay (ADR-0004) — and the fade is fully disabled under
    reduced motion (switching applies instantly). Both steps run with
    `fill: "both"` so the root holds its end state through the palette swap —
    a single toggle never flashes at full opacity between fade-out and
    fade-in. Known cosmetic caveat: a rapid double theme-toggle mid-fade may
    briefly show a full-opacity frame of the previous palette (last request
    wins; the final state is always correct).
5. **D5 — The engine ships composable, testable primitives.** Motion manager
   (reduced-motion gate + token translation + driver), timeline (parallel
   steps with `at` offsets, `finished` resolution, cancel), transition
   manager (enter/exit state machine with auto-cancel via
   `WeakMap<Element, MotionHandle>`). All accept injected driver/matchMedia
   seams for headless vitest.

## Consequences

- `ui/motion/` is the only place that touches WAAPI; components speak tokens
  and presets. A raw `Element.animate`, inline keyframes, or
  `requestAnimationFrame` outside `graphics/` and `ui/motion/driver.ts` is
  review-rejectable on sight (enforced for `ui/motion/` by the
  motion-enforcement test).
- Svelte transition directives (`transition:`/`in:`/`out:`/`animate:`) are
  banned across `src/lib` markup — the motion contract is enforced by one
  engine and one policy, not per-component syntax (enforced by test).
- Reduced motion is two-layer: the manager gate kills JS-orchestrated motion at
  the source; the CSS `!important`-style safety net kills transition-driven
  motion. `transitionTheme()` and `exit()` treat handles as already-done so
  callers never await a never-settling promise.
- The easing vocabulary grows from one to three designated variants
  (`--ease-standard`, `--ease-spring`, `--ease-smooth`) plus the
  `--motion-*` role pairs; a new `--duration-micro` (80ms) joins the scale for
  press feedback. The CSS↔TS sync rule (ADR-0003) now covers these tokens and
  is test-enforced.
- `ui/motion/` is DOM-only. Graphics-side animation (M2.4) belongs to the
  renderer loop / compose seam (`graphics/`), never `ui/motion/`.

## Related Documents

- Amended: [`0003-design-tokens.md`](0003-design-tokens.md)
- [`../30-specs/Animation.md`](../30-specs/Animation.md) (M2.3 specification)
- [`../20-architecture/20_System_Architecture.md`](../20-architecture/20_System_Architecture.md)
- [`../20-architecture/25_Graphics.md`](../20-architecture/25_Graphics.md)
- [`0008-threejs-renderer.md`](0008-threejs-renderer.md)
