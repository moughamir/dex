import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";
import type { SystemSnapshot } from "$lib/core/types/system";

/**
 * Contract client for the system domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/system.rs`; typed, surfaces `IpcError`.
 */
export async function systemSnapshot(): Promise<SystemSnapshot> {
  return invoke(COMMANDS.systemSnapshot, {});
}