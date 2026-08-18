import type { SidebarSection, WorkspaceId } from "./types";

/**
 * Contextual sidebar navigation per workspace.
 * Item `id`s are kebab-case and stable across releases.
 */
export const SIDEBAR_NAV: Record<WorkspaceId, SidebarSection[]> = {
  dashboard: [
    {
      id: "dashboard",
      title: "Dashboard",
      items: [
        { id: "overview", label: "Overview", href: "/" },
        { id: "activity", label: "Activity", href: "/activity" },
        { id: "analytics", label: "Analytics", href: "/analytics" },
        { id: "reports", label: "Reports", href: "/reports" },
      ],
    },
  ],
  projects: [
    {
      id: "projects",
      title: "Projects",
      items: [
        { id: "all-projects", label: "All Projects", href: "/projects" },
        { id: "favorites", label: "Favorites", href: "/projects/favorites" },
        { id: "templates", label: "Templates", href: "/projects/templates" },
        { id: "archived", label: "Archived", href: "/projects/archived" },
      ],
    },
  ],
  database: [
    {
      id: "database",
      title: "Database",
      items: [
        {
          id: "connections",
          label: "Connections",
          href: "/database/connections",
        },
        { id: "schemas", label: "Schemas", href: "/database/schemas" },
        { id: "tables", label: "Tables", href: "/database/tables" },
        { id: "queries", label: "Queries", href: "/database/queries" },
        { id: "backups", label: "Backups", href: "/database/backups" },
      ],
    },
  ],
  agents: [
    {
      id: "agents",
      title: "Agents",
      items: [
        { id: "installed", label: "Installed", href: "/agents" },
        { id: "running", label: "Running", href: "/agents/running" },
        {
          id: "marketplace",
          label: "Marketplace",
          href: "/agents/marketplace",
        },
        { id: "history", label: "History", href: "/agents/history" },
        { id: "logs", label: "Logs", href: "/agents/logs" },
      ],
    },
  ],
  plugins: [
    {
      id: "plugins",
      title: "Plugins",
      items: [
        { id: "installed", label: "Installed", href: "/plugins" },
        {
          id: "marketplace",
          label: "Marketplace",
          href: "/plugins/marketplace",
        },
        { id: "updates", label: "Updates", href: "/plugins/updates" },
        { id: "developer", label: "Developer", href: "/plugins/developer" },
      ],
    },
  ],
};
