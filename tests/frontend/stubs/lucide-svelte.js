/**
 * Test double for `lucide-svelte`.
 *
 * The real package barrel statically re-exports ~1900 icon `.svelte`
 * components, and vitest's node pool compiles each one on import —
 * a single `import { House } from "lucide-svelte"` costs ~80s of
 * transform time. Tests that only assert data/config structure (e.g.
 * `DOCK_WORKSPACES`) do not need real components, so `vitest.config.ts`
 * aliases `lucide-svelte` here.
 *
 * The exported names mirror the icons currently consumed by `src/` config
 * modules under test. If a new icon is imported by a module under test,
 * add it here.
 */
function createIcon() {
  return function Icon() {};
}

export const House = createIcon();
export const Database = createIcon();
export const FolderKanban = createIcon();
export const Bot = createIcon();
export const Package = createIcon();
