import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import type { z } from "zod";
import { logError } from "$lib/core/utils/logger";

/**
 * Event name registry — ADR-0002 §5.
 *
 * Every Rust→UI event is declared here with its canonical name
 * `dex.<domain>.<event>` and payload schema. Only `src-tauri/src/events/`
 * emits; only names declared here may be subscribed. Add an entry when the
 * first emitter of a domain lands (Phase 4 M4.x and onward).
 */
export const EVENTS = {
  // "dex.system.resources": z.object({ /* ... */ }),
} as const;

/**
 * Typed Rust→UI event subscription — ADR-0002 §5.
 *
 * Payloads that fail the schema are logged and dropped, never thrown into
 * the handler: a misbehaving emitter must not crash the shell. Event names
 * follow `dex.<domain>.<event>` and belong to the EVENTS registry.
 */
export function onEvent<R>(
  name: string,
  schema: z.ZodType<R>,
  handler: (payload: R) => void,
): Promise<UnlistenFn> {
  return listen<unknown>(name, (event) => {
    const result = schema.safeParse(event.payload);
    if (!result.success) {
      logError(`[events] '${name}' payload failed validation`, result.error);
      return;
    }
    handler(result.data);
  });
}
