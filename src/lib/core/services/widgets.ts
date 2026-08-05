import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";
import type { WidgetDescriptor, WidgetLayout } from "$lib/core/types/widget";

/**
 * Contract client for the widgets domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/widgets.rs`; typed, surfaces `IpcError`.
 */
export interface WidgetsAvailableResult {
  widgets: WidgetDescriptor[];
}

export async function widgetsAvailable(): Promise<WidgetsAvailableResult> {
  return invoke(COMMANDS.widgetsAvailable, {});
}

export async function widgetsLayoutGet(): Promise<WidgetLayout> {
  return invoke(COMMANDS.widgetsLayoutGet, {});
}

export async function widgetsLayoutSet(layout: WidgetLayout): Promise<null> {
  return invoke(COMMANDS.widgetsLayoutSet, { layout });
}