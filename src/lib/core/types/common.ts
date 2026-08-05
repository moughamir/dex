/**
 * Shared wire enums and cross-domain shapes.
 *
 * These are plain TS unions mirroring the zod `z.enum` schemas declared in
 * `core/api/commands.ts` (the IPC contract authority). Keep the string
 * values in lockstep with the Rust serde serialization.
 */

export type ProcessState =
  | "unknown"
  | "running"
  | "sleeping"
  | "waiting"
  | "stopped"
  | "zombie"
  | "dead";

export type ProcessPriority =
  | "idle"
  | "below_normal"
  | "normal"
  | "above_normal"
  | "high"
  | "realtime";

export type NetworkAdapterKind =
  | "unknown"
  | "ethernet"
  | "wireless"
  | "cellular"
  | "bluetooth"
  | "loopback"
  | "virtual";

export type NetworkAdapterState =
  | "unknown"
  | "disabled"
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "failed";

export type ConnectionState =
  | "unknown"
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "failed";

export type ModemState =
  | "unknown"
  | "disabled"
  | "initializing"
  | "searching"
  | "registered"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "failed";

export type AccessTechnology =
  | "unknown"
  | "gsm"
  | "gprs"
  | "edge"
  | "umts"
  | "hspa"
  | "hspa_plus"
  | "lte"
  | "nr_5g";

export type SimState =
  | "unknown"
  | "absent"
  | "locked"
  | "pin_required"
  | "puk_required"
  | "ready"
  | "error";

/** A single entry from the `history_list` command result. */
export interface HistoryEntry {
  id: number;
  kind: string;
  title: string;
  detail: string | null;
  created_at: string;
}