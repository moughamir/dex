# graphics/ — Rendering Architecture (Phase 0)

The `graphics/` layer owns everything GPU. Its job: render the shell's visual
depth (backdrop scenes, particle ambience, window effects) into a transparent
WebGL canvas composited **under** the DOM chrome.

## Rules

1. **Ownership** — only code under `graphics/` touches WebGL/Three.js. `ui/`
   and `features/` consume `graphics/contracts.ts` (the `Renderer` /
   `RenderSurface` interfaces) and the theme palette — never `three` directly.
2. **Transparency (ADR-0004)** — the canvas is created with `alpha: true` and
   the window background stays transparent. The desktop and the DOM glass
   panels show through; the renderer never paints an opaque backdrop.
3. **Frame loop** — exactly one loop owner (requestAnimationFrame, driven by
   the renderer). It starts lazily on first visual need and stops with
   `dispose()`. Nothing outside `graphics/` schedules frames.
4. **DPR** — the backing store is sized in device pixels (`surface.resize`);
   resize follows the window, not the CSS box.
5. **Palette bridge (ADR-0003)** — scene colors come from
   `ui/themes/*.ts` (`ThemePalette`), keeping WebGL and DOM visuals in sync;
   theme changes are pushed to the renderer by its owner, never polled.
6. **Resource discipline** — every GPU object (geometry, texture, material)
   is disposed with its owner. `dispose()` is total: no orphaned buffers,
   no leaked listeners.
7. **Performance contract** — 60 FPS floor; zero per-frame allocations in
   steady state; `prefers-reduced-motion` disables ambient animation.

## Layout (Phase 1+ implementations land in these files)

- `renderer.ts` — `Renderer` implementation (WebGL context, loop, DPR,
  `compose` seam, `subscribeFps`)
- `fps.ts` — allocation-free windowed FPS meter (`createFpsMeter`)
- `scene.ts`, `camera.ts`, `lighting.ts`, `controls.ts`
- `effects/` — post/effects: `manager.ts` (composition root), `fog.ts`,
  `background.ts`, `grid.ts`, `particles.ts`, `color.ts`
- `shaders/` — GLSL: `background.glsl.ts`
- `core/` — resource utilities: `pool.ts` (object pool), `texture-cache.ts`
  (ref-counted texture cache) · `materials/` — shader materials ·
  `objects/` — scene objects

Phase 0 shipped only `contracts.ts` (+ this doc). M2.1 implements the core
renderer behind the contracts (`renderer.ts`, `scene.ts`, `camera.ts`,
`lighting.ts`; see ADR-0008). M2.2 adds the effects composition
(`effects/manager.ts` + sub-effects, via the renderer's `compose` seam), with
`scene.background` staying null — the backdrop is a transparent shader plane.
M2.3 added the DOM motion engine under `ui/motion/` (ADR-0009) — DOM-only, not
graphics. M2.4 added the performance layers: dirty-flag render skip +
`visibilitychange` pause/resume (GFX-005), the windowed FPS meter (`fps.ts` +
`subscribeFps`) with the `FpsMonitor.svelte` chip, and the object pool +
ref-counted texture cache (`core/`). No speculative engine code ahead of the
milestone that needs it.
