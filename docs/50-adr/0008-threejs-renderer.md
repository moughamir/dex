# ADR-0008: Three.js as the Graphics Renderer

- Status: Accepted
- Date: 2026-08-09
- Deciders: Principal Architect
- Scope: The `graphics/` layer renderer implementation (M2.1 Three.js Core)

## Context

Phase 0 shipped the engine-agnostic renderer contracts in
`src/lib/graphics/contracts.ts` (`RgbaColor`, `RenderSurface`, `Renderer`)
and documented the rendering stack in
[`20-architecture/25_Graphics.md`](../20-architecture/25_Graphics.md). That
document explicitly deferred the renderer decision: *"The renderer decision
has not been made yet; it will be recorded in an ADR when the renderer is
chosen in Phase 2."*

M2.1 (Three.js Core — renderer, scene, camera, lights, per
`11_Product_Roadmap.md`) is the milestone that implements the contracts.
Choosing the engine is a Phase-2 decision with lasting consequences:

1. The shell's visual depth (backdrop scenes, particle ambience, window
   effects) renders into a transparent WebGL canvas composited **under** the
   DOM chrome (ADR-0004). The canvas must be transparent (`alpha: true`),
   sized in device pixels, and driven by exactly one frame-loop owner.
2. Consumers (`ui/`, `features/`) depend on the contracts and the
   `ThemePalette` mirror (ADR-0003) — never on the engine directly. The engine
   must be swappable without touching consumers.
3. The performance contract (`40-engineering/Performance.md`) requires a
   60 FPS floor, zero per-frame allocations in steady state, lazy
   initialization on first visual need, and `prefers-reduced-motion` support.

Candidates considered: raw WebGL2 (hand-rolled pipeline), Three.js (WebGL2
scene graph + renderer), and WebGPU-only engines. WebGPU support in the
bundled WebView (webkit2gtk) is not yet a safe floor, and raw WebGL2 would
re-implement scene management, camera math, and resource bookkeeping that the
milestone needs immediately (M2.2 effects, M2.3 animation, M2.4 pooling).

## Decision

1. **D1 — Three.js is the graphics engine**, pinned at `three@^0.185.1` with
   `@types/three@^0.185.4` (types stay separate — three does not bundle them;
   keep both in lockstep; `bun.lock` resolves `three@0.185.1` /
   `@types/three@0.185.4` exactly). WebGL 2 is the floor (three dropped WebGL 1
   in r163, matching the project's WebGL2-only stance). The renderer is
   constructed with `{ alpha: true, antialias: true, premultipliedAlpha:
   true, powerPreference: "high-performance", failIfMajorPerformanceCaveat:
   false }` and clears transparent (`setClearColor(0x000000, 0)`) — the
   ADR-0004 contract: nothing opaque is ever painted.
2. **D2 — The engine stays behind the contracts.** `graphics/` implements the
   `Renderer`/`RenderSurface` contracts; only `graphics/` touches `three`.
   The concrete surface is extended with `applyPalette(ThemePalette)` so the
   owner pushes theme changes (ADR-0003 push model, never polled). Consumers
   acquire the concrete surface through the `createRenderer` factory exported
   from `graphics/renderer.ts` (the sanctioned M2.1 entry point); contract
   types come from `contracts.ts`, and engine imports are not visible outside
   `graphics/`.
3. **D3 — DPR handling is explicit.** `RenderSurface.resize(width, height)`
   receives **device pixels**; the renderer calls `setPixelRatio(1)` +
   `setSize(w, h, false)` so the backing store equals the device
   dimensions without double-scaling and without touching CSS size
   (`updateStyle: false`; the CSS box is owned by the layout).
4. **D4 — One frame-loop owner.** The renderer owns the single
   `requestAnimationFrame` loop: lazy `start()` on first visual need,
   idempotent, returning a `stop()` handle; `dispose()` is total (loop
   cancelled, `renderer.dispose()`, best-effort `forceContextLoss()`, canvas
   detached, scene traversed freeing geometries/materials). `prefers-reduced-
   motion` renders one static frame instead of running the loop.
5. **D5 — Headless testability.** The renderer accepts an injected
   `glRenderer` (a minimal `WebGLRenderer`-shaped seam); unit tests never
   construct a real WebGL renderer (no GPU in vitest). Scene/camera/lighting
   construction is pure JS and is tested directly.

## Consequences

- `three` + `@types/three` join the frontend dependency set; bundle size
  grows by the three modules actually imported (scene, camera, lights,
  WebGLRenderer) — acceptable for a desktop shell; tree-shaking is exercised
  at build.
- WebGPU engines are out until the webview floor supports them; the contract
  boundary keeps that swap possible without touching consumers (D2).
- Scene colors are set from the palette's hex strings; three's color
  management linearizes them for lights automatically (correct for
  physically-based lighting) — no manual color-space code.
- The renderer's transparency is guaranteed at the backing store; the DOM
  glass/blur contract (ADR-0004) continues to handle the chrome layers above
  the canvas.
- Anything outside `graphics/` that constructs a `THREE.WebGLRenderer` or
  touches the canvas context is review-rejectable on sight (ADR-0004 §4,
  `graphics/README.md` ownership rule).
