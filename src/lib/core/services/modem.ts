import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";
import type { ModemInfo, ModemListResult } from "$lib/core/types/modem";

/**
 * Contract client for the modem domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/modem.rs`; typed, surfaces `IpcError`.
 */
export async function modemList(): Promise<ModemListResult> {
  return invoke(COMMANDS.modemList, {});
}

export async function modemDetails(id: string): Promise<ModemInfo> {
  return invoke(COMMANDS.modemDetails, { id });
}