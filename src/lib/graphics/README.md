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

- `renderer.ts` — `Renderer` implementation (WebGL context, loop, DPR)
- `scene.ts`, `camera.ts`, `lighting.ts`, `controls.ts`, `particles.ts`
- `core/` — context/state helpers · `materials/` — shader materials ·
  `effects/` — post/effects · `shaders/` — GLSL · `objects/` — scene objects

Phase 0 ships only `contracts.ts` (+ this doc). Implementations arrive with
the first feature that needs GPU visuals — no speculative engine code.
