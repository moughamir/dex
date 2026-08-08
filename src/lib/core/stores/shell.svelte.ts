import { page } from "$app/state";

import { SIDEBAR_NAV, type SidebarSection } from "$lib/core/config/navigation";
import { resolveWorkspace } from "$lib/core/utils/helpers";

/**
 * Shell Store
 *
 * Holds the runtime state of the shell chrome: the active workspace and
 * the visibility/collapse flags for the sidebar and dock. Navigation
 * data itself lives in `core/config/navigation` — this store only tracks
 * selection and visibility.
 *
 * The active workspace is derived reactively from the current route via
 * the canonical resolver (`resolveWorkspace`), so Dock/TopBar/StatusBar
 * always share a single source of truth. Safe here because the app is
 * SPA-only (ssr = false).
 */
class ShellStore {
  /** Workspace derived from the current route (`$app/state`). */
  activeWorkspace = $derived(resolveWorkspace(page.url.pathname));

  sidebarCollapsed = $state(false);

  dockVisible = $state(true);

  sidebarVisible = $state(true);

  /**
   * Contextual sidebar navigation for the active workspace.
   */
  get currentContext(): SidebarSection[] {
    return SIDEBAR_NAV[this.activeWorkspace];
  }

  /**
   * Boot the shell state. Idempotent.
   * Call once from +layout.svelte.
   */
  init(): void {
    // The active workspace is route-derived via `$derived`; there is no
    // state to seed. Kept as the boot hook for API stability.
  }

  /**
   * Toggle the sidebar collapsed state.
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /**
   * Set the sidebar collapsed state.
   */
  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  /**
   * Set the dock visibility.
   */
  setDockVisible(visible: boolean): void {
    this.dockVisible = visible;
  }

  /**
   * Set the sidebar visibility.
   */
  setSidebarVisible(visible: boolean): void {
    this.sidebarVisible = visible;
  }
}

export const shellStore = new ShellStore();
