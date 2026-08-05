/**
 * Public core surface — ADR-0002.
 *
 * Barrel for the core layer: IPC contracts, contract clients, wire types and
 * utilities. Features import from here (`import { ... } from "$lib/core"`)
 * rather than reaching into individual modules. Only modules that exist
 * today are re-exported; the store/event-bus surface lands in a later slice.
 */
export * from "./api/commands";
export * from "./api/events";
export * from "./api/tauri";

export * from "./services";

export * from "./types/application";
export * from "./types/common";
export * from "./types/modem";
export * from "./types/network";
export * from "./types/plugin";
export * from "./types/process";
export * from "./types/settings";
export * from "./types/system";
export * from "./types/widget";
export * from "./types/workspace";

export * from "./utils/date";
export * from "./utils/format";
export * from "./utils/helpers";
export * from "./utils/logger";
export * from "./utils/storage";