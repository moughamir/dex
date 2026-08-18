import type { House } from "lucide-svelte";

/**
 * Identifiers for the top-level workspaces surfaced in the dock.
 */
export type WorkspaceId =
  "dashboard" | "projects" | "database" | "agents" | "plugins";

/**
 * A top-level workspace entry rendered by the dock.
 * Active state is derived at runtime, never hardcoded.
 *
 * `typeof House` follows the legacy config pattern — all lucide icon
 * classes are structurally identical, so any lucide icon is assignable.
 */
export interface Workspace {
  id: WorkspaceId;
  label: string;
  href: string;
  icon: typeof House;
}

/**
 * A single contextual navigation item within a workspace sidebar.
 */
export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

/**
 * A titled (or untitled) group of sidebar navigation items.
 */
export interface SidebarSection {
  id: string;
  title?: string;
  items: SidebarItem[];
}
