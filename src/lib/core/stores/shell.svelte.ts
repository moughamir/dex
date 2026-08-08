import {
  DOCK_WORKSPACES,
  SIDEBAR_NAV,
  type SidebarSection,
  type Workspace,
  type WorkspaceId,
} from "$lib/core/config/navigation";

/**
 * Shell Store
 *
 * Holds the runtime state of the shell chrome: the active workspace and
 * the visibility/collapse flags for the sidebar and dock. Navigation
 * data itself lives in `core/config/navigation` — this store only tracks
 * selection and visibility.
 */
class ShellStore {
  activeWorkspace = $state<WorkspaceId>("dashboard");

  sidebarCollapsed = $state(false);

  dockVisible = $state(true);

  sidebarVisible = $state(true);

  #initialized = false;

  /**
   * Contextual sidebar navigation for the active workspace.
   */
  get currentContext(): SidebarSection[] {
    return SIDEBAR_NAV[this.activeWorkspace];
  }

  /**
   * Activate a workspace.
   */
  selectWorkspace(id: WorkspaceId): void {
    this.activeWorkspace = id;
  }

  /**
   * Boot the shell state. Idempotent.
   * Call once from +layout.svelte.
   */
  init(): void {
    if (this.#initialized) {
      return;
    }

    this.#initialized = true;

    this.activeWorkspace = this.#resolveWorkspace(window.location.pathname);
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

  /**
   * Derive the active workspace from a pathname by matching the longest
   * workspace `href` prefix (e.g. "/database/connections" → "database").
   * Falls back to "dashboard" when no workspace matches.
   */
  #resolveWorkspace(pathname: string): WorkspaceId {
    let match: Workspace | undefined;

    for (const workspace of DOCK_WORKSPACES) {
      if (
        pathname.startsWith(workspace.href) &&
        (match === undefined || workspace.href.length > match.href.length)
      ) {
        match = workspace;
      }
    }

    return match?.id ?? "dashboard";
  }
}

export const shellStore = new ShellStore();
