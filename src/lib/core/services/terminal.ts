import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";

/**
 * Contract client for the terminal domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/terminal.rs`; typed, surfaces `IpcError`.
 */
export interface TerminalSpawnOptions {
  shell?: string | null;
  cwd?: string | null;
  cols?: number | null;
  rows?: number | null;
}

export interface TerminalSpawnResult {
  id: string;
  pid: number;
}

export async function terminalSpawn(
  options: TerminalSpawnOptions = {},
): Promise<TerminalSpawnResult> {
  return invoke(COMMANDS.terminalSpawn, options);
}

export async function terminalInput(id: string, data: string): Promise<null> {
  return invoke(COMMANDS.terminalInput, { id, data });
}

export async function terminalResize(
  id: string,
  cols: number,
  rows: number,
): Promise<null> {
  return invoke(COMMANDS.terminalResize, { id, cols, rows });
}

export async function terminalKill(id: string): Promise<null> {
  return invoke(COMMANDS.terminalKill, { id });
}
