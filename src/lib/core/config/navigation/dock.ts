import { Bot, Database, FolderKanban, House, Package } from "lucide-svelte";

import type { Workspace } from "./types";

/**
 * Ordered list of dock workspaces (render order is authoritative).
 */
export const DOCK_WORKSPACES: Workspace[] = [
	{
		id: "dashboard",
		label: "Dashboard",
		href: "/",
		icon: House
	},
	{
		id: "projects",
		label: "Projects",
		href: "/projects",
		icon: FolderKanban
	},
	{
		id: "database",
		label: "Database",
		href: "/database",
		icon: Database
	},
	{
		id: "agents",
		label: "Agents",
		href: "/agents",
		icon: Bot
	},
	{
		id: "plugins",
		label: "Plugins",
		href: "/plugins",
		icon: Package
	}
];
