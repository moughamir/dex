import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";
import type { ProcessInfo, ProcessListResult } from "$lib/core/types/process";

/**
 * Contract client for the process domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/process.rs`; typed, surfaces `IpcError`.
 */

export interface ProcessListArgs {
  search?: string | null;
  sort_by?: "cpu" | "memory" | "name" | "pid" | null;
  sort_dir?: "asc" | "desc" | null;
  filter?: "all" | "running" | "sleeping" | "zombie" | null;
}

export async function processList(args: ProcessListArgs = {}): Promise<ProcessListResult> {
  return invoke(COMMANDS.processList, args);
}

export async function processDetails(pid: number): Promise<ProcessInfo> {
  return invoke(COMMANDS.processDetails, { pid });
}

export async function processTerminate(
  pid: number,
  signal: "terminate" | "kill",
): Promise<null> {
  return invoke(COMMANDS.processTerminate, { pid, signal });
}

export interface ProcessSpawnOptions {
  command: string;
  args: string[];
  cwd?: string | null;
  env?: Record<string, string> | null;
}

export interface ProcessSpawnResult {
  pid: number;
  task_id: string;
}

export async function processSpawn(options: ProcessSpawnOptions): Promise<ProcessSpawnResult> {
  return invoke(COMMANDS.processSpawn, {
    command: options.command,
    args: options.args,
    cwd: options.cwd ?? null,
    env: options.env ?? null,
  });
}