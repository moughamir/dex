import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";

/**
 * Contract client for the `greet` command domain — ADR-0002.
 *
 * The only public surface features may use to reach Rust. Mirrors
 * `src-tauri/src/commands/core.rs`; typed, surfaces `IpcError` on failure.
 */
export async function greet(name: string): Promise<string> {
  const output = await invoke(COMMANDS.greet, { name });
  return output.message;
}
