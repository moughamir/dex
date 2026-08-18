import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";
import type { Settings } from "$lib/core/types/settings";

/**
 * Contract client for the settings domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/settings.rs`; typed, surfaces `IpcError`.
 */
export async function settingsGet(): Promise<Settings> {
  return invoke(COMMANDS.settingsGet, {});
}

export async function settingsSet(settings: Settings): Promise<Settings> {
  return invoke(COMMANDS.settingsSet, { settings });
}

export async function settingsReset(): Promise<Settings> {
  return invoke(COMMANDS.settingsReset, {});
}
