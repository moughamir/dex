import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";

/**
 * Contract client for the core domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/core.rs`; typed, surfaces `IpcError`.
 */

/**
 * Mark the given init task complete. Called by the splashscreen once the
 * frontend has painted; the Rust side uses it to sequence app startup.
 */
export async function setComplete(task: "frontend" | "backend"): Promise<void> {
  await invoke(COMMANDS.setComplete, { task });
}
