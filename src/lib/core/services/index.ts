/**
 * Service registry — ADR-0002.
 *
 * Single import point for every contract client. Each domain module is
 * re-exported so features can `import { systemSnapshot } from "$lib/core/services"`
 * directly, and the `services` container groups them for call sites that
 * prefer a single namespaced object. Constructed once at module load.
 */
export * from "./system";
export * from "./network";
export * from "./process";
export * from "./modem";
export * from "./settings";
export * from "./widgets";
export * from "./terminal";
export * from "./plugins";
export * from "./history";

import * as history from "./history";
import * as modem from "./modem";
import * as network from "./network";
import * as plugins from "./plugins";
import * as process from "./process";
import * as settings from "./settings";
import * as system from "./system";
import * as terminal from "./terminal";
import * as widgets from "./widgets";

/** Typed container of all nine contract clients. */
export const services = {
  system,
  network,
  process,
  modem,
  settings,
  widgets,
  terminal,
  plugins,
  history,
} as const;

export type Services = typeof services;
