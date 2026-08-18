import { COMMANDS } from "$lib/core/api/commands";
import { invoke } from "$lib/core/api/tauri";
import type {
  NetworkAdaptersResult,
  NetworkConnectionsResult,
  NetworkStatistics,
} from "$lib/core/types/network";

/**
 * Contract client for the network domain — ADR-0002.
 * Mirrors `src-tauri/src/commands/network.rs`; typed, surfaces `IpcError`.
 */
export async function networkAdapters(): Promise<NetworkAdaptersResult> {
  return invoke(COMMANDS.networkAdapters, {});
}

export async function networkConnections(): Promise<NetworkConnectionsResult> {
  return invoke(COMMANDS.networkConnections, {});
}

export async function networkStatistics(): Promise<NetworkStatistics> {
  return invoke(COMMANDS.networkStatistics, {});
}

export async function networkSetEnabled(
  interfaceName: string,
  enabled: boolean,
): Promise<null> {
  return invoke(COMMANDS.networkSetEnabled, {
    interface: interfaceName,
    enabled,
  });
}
