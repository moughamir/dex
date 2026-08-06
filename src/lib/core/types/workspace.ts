/**
 * Workspace shell preferences persisted to localStorage under the
 * `dex.workspace` key and applied to `stores/shell.svelte.ts`.
 */
export interface WorkspacePreferences {
  dockVisible: boolean;
  sidebarVisible: boolean;
  sidebarCollapsed: boolean;
}

export const DEFAULT_WORKSPACE_PREFS: WorkspacePreferences = {
  dockVisible: true,
  sidebarVisible: true,
  sidebarCollapsed: false,
};