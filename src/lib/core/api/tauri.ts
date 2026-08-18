import { invoke as tauriInvoke, type InvokeArgs } from "@tauri-apps/api/core";
import { z } from "zod";
import type { CommandContract } from "./commands";

/**
 * Typed IPC plumbing — ADR-0002.
 * `@tauri-apps/api` is imported nowhere outside core/api/. Features talk to
 * Rust exclusively through core/services contract clients built on these.
 */

/** Closed set of wire error codes — mirrored from Rust AppError (ADR-0002). */
export const ERROR_CODES = [
  "validation",
  "not_found",
  "permission_denied",
  "conflict",
  "unsupported",
  "internal",
] as const;

/** The AppError wire envelope, exactly as Rust serializes it. */
const ErrorEnvelope = z.object({
  type: z.enum(ERROR_CODES),
  message: z.string(),
});

/** Structured IPC error mirroring the Rust AppError wire envelope. */
export class IpcError extends Error {
  readonly type: string;

  constructor(type: string, message: string) {
    super(message);
    this.name = "IpcError";
    this.type = type;
  }

  /**
   * Wraps any rejection. Two shapes reach callers (ADR-0002):
   * the structured AppError envelope (validated against the closed code set)
   * and a transport rejection (Tauri string / unknown) → type "unknown".
   */
  static fromUnknown(cause: unknown): IpcError {
    const parsed = ErrorEnvelope.safeParse(cause);
    if (parsed.success)
      return new IpcError(parsed.data.type, parsed.data.message);
    const message = cause instanceof Error ? cause.message : String(cause);
    return new IpcError("unknown", message);
  }
}

/**
 * Boundary-validated IPC call. Args are validated before the round trip
 * (fail fast); the result is validated after (detect Rust ⇄ TS drift).
 */
export async function invoke<A extends z.ZodType, R extends z.ZodType>(
  contract: CommandContract<A, R>,
  args: z.input<A>,
): Promise<z.output<R>> {
  const parsedArgs = contract.args.parse(args) as InvokeArgs;
  let raw: unknown;
  try {
    // Tauri 2 keys invoke payloads by the Rust parameter name (ADR-0002):
    // commands declare their single struct arg as `args`, so the wire shape
    // is { args: { ...fields } }, never the fields themselves. Field-spread
    // invoke fails every command ("command <name> missing required key args").
    raw = await tauriInvoke(contract.name, { args: parsedArgs });
  } catch (cause) {
    throw IpcError.fromUnknown(cause);
  }
  try {
    return contract.result.parse(raw);
  } catch (cause) {
    throw new IpcError(
      "contract",
      `Response for '${contract.name}' failed validation: ${String(cause)}`,
    );
  }
}
