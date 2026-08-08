import { DOCK_WORKSPACES } from "$lib/core/config/navigation";
import type { WorkspaceId } from "$lib/core/config/navigation";

/**
 * Resolve a workspace label from its ID.
 * Falls back to "Digital Experience" when the workspace is unknown.
 */
export function workspaceLabel(id: WorkspaceId): string {
  return (
    DOCK_WORKSPACES.find((workspace) => workspace.id === id)?.label ??
    "Digital Experience"
  );
}

/**
 * Resolve the active workspace ID from a pathname by matching the
 * longest workspace `href` prefix. Falls back to "dashboard".
 */
export function resolveWorkspace(pathname: string): WorkspaceId {
  let match: { id: WorkspaceId; href: string } | undefined;

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
