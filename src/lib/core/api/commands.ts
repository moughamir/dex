import { z } from "zod";

/**
 * IPC contract layer — ADR-0002.
 *
 * Every callable Tauri command is described by one CommandContract: a command
 * name plus zod schemas for its args and result. `invoke` (core/api/tauri.ts)
 * validates both edges; the Rust side validates via serde. A command is not
 * callable until it is listed here AND registered in the Rust invoke_handler
 * (src-tauri/src/lib.rs).
 */

export interface CommandContract<A extends z.ZodType, R extends z.ZodType> {
  /** Must equal the Rust #[tauri::command] fn name. */
  readonly name: string;
  readonly args: A;
  readonly result: R;
}

const registered = new Set<string>();

export const defineCommand = <A extends z.ZodType, R extends z.ZodType>(
  name: string,
  args: A,
  result: R,
): CommandContract<A, R> => {
  if (registered.has(name)) {
    throw new Error(`Duplicate command contract: '${name}'`);
  }
  registered.add(name);
  return { name, args, result };
};

/**
 * Registry of all IPC commands. Adding a command:
 *   1. Rust: src-tauri/src/commands/<domain>.rs + invoke_handler in lib.rs
 *   2. TS:   add its contract here
 *   3. TS:   expose a typed function in core/services/<domain>.ts
 */
export const COMMANDS = {
  greet: defineCommand(
    "greet",
    z.object({ name: z.string() }),
    z.object({ message: z.string() }),
  ),
} as const;
