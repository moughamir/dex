import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";
import type { PluginInfo } from "$lib/core/types/plugin";

/**
 * Contract client for the plugins domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/plugins.rs`; typed, surfaces `IpcError`.
 */
export interface PluginsListResult {
  plugins: PluginInfo[];
}

export async function pluginsList(): Promise<PluginsListResult> {
  return invoke(COMMANDS.pluginsList, {});
}

export async function pluginsSetEnabled(id: string, enabled: boolean): Promise<null> {
  return invoke(COMMANDS.pluginsSetEnabled, { id, enabled });
}