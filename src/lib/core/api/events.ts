import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { z } from "zod";
import { logError } from "$lib/core/utils/logger";
import { SettingsSchema } from "./commands";

/**
 * Event name registry — ADR-0002 §5.
 *
 * Every Rust→UI event is declared here with its canonical name
 * `dex.<domain>.<event>` and payload schema. Only `src-tauri/src/events/`
 * emits; only names declared here may be subscribed. All wire keys are
 * snake_case.
 */
export const EVENTS = {
  "dex.system.resources": z.object({
    cpu_percent: z.number(),
    memory: z.object({
      total_bytes: z.number(),
      used_bytes: z.number(),
      available_bytes: z.number(),
      usage_percent: z.number(),
    }),
    uptime_secs: z.number(),
    generated_at: z.number(),
  }),
  "dex.system.battery": z.object({
    percent: z.number(),
    charging: z.boolean(),
    remaining_secs: z.number().nullable(),
  }),
  "dex.process.updated": z.object({
    processes: z.array(
      z.object({
        pid: z.number(),
        name: z.string(),
        cpu_percent: z.number(),
        memory_bytes: z.number(),
        state: z.string(),
      }),
    ),
    generated_at: z.number(),
  }),
  "dex.process.spawned": z.object({
    pid: z.number(),
    parent_pid: z.number().nullable(),
    name: z.string(),
  }),
  "dex.process.exited": z.object({
    pid: z.number(),
    exit_code: z.number().nullable(),
  }),
  "dex.network.adapter_added": z.object({
    interface: z.string(),
    name: z.string(),
    kind: z.string(),
  }),
  "dex.network.adapter_removed": z.object({
    interface: z.string(),
  }),
  "dex.network.adapter_state_changed": z.object({
    interface: z.string(),
    previous: z.string(),
    current: z.string(),
  }),
  "dex.network.statistics": z.object({
    per_adapter: z.array(
      z.object({
        interface: z.string(),
        rx_bytes: z.number(),
        tx_bytes: z.number(),
        rx_rate: z.number(),
        tx_rate: z.number(),
      }),
    ),
    generated_at: z.number(),
  }),
  "dex.modem.added": z.object({
    id: z.string(),
    manufacturer: z.string(),
    model: z.string(),
  }),
  "dex.modem.removed": z.object({
    id: z.string(),
  }),
  "dex.modem.state_changed": z.object({
    id: z.string(),
    previous: z.string(),
    current: z.string(),
  }),
  "dex.modem.signal_changed": z.object({
    id: z.string(),
    quality: z.number(),
    rssi: z.number().nullable(),
  }),
  "dex.terminal.output": z.object({
    id: z.string(),
    data: z.string(),
  }),
  "dex.terminal.exit": z.object({
    id: z.string(),
    code: z.number().nullable(),
  }),
  "dex.settings.changed": z.object({
    settings: SettingsSchema,
  }),
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