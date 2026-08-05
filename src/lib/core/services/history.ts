import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";
import type { HistoryEntry } from "$lib/core/types/common";

/**
 * Contract client for the history domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/history.rs`; typed, surfaces `IpcError`.
 */
export interface HistoryListResult {
  entries: HistoryEntry[];
}

export async function historyList(limit?: number | null): Promise<HistoryListResult> {
  return invoke(COMMANDS.historyList, { limit: limit ?? null });
}