import type {
  ConnectionState,
  NetworkAdapterKind,
  NetworkAdapterState,
} from "./common";

export interface RouteInfo {
  destination: string;
  gateway: string | null;
  netmask: string | null;
  interface: string;
}

export interface NetworkAdapterInfo {
  id: string;
  interface: string;
  name: string;
  mac_address: string | null;
  kind: NetworkAdapterKind;
  state: NetworkAdapterState;
  speed_mbps: number | null;
  driver: string | null;
  enabled: boolean;
  ipv4: string[];
  ipv6: string[];
  gateway: string | null;
  dns: string[];
  routes: RouteInfo[];
  rx_bytes: number;
  tx_bytes: number;
  rx_rate: number;
  tx_rate: number;
}

export interface NetworkConnectionInfo {
  id: string;
  name: string;
  adapter_id: string;
  state: ConnectionState;
  ipv4: string | null;
  ipv6: string | null;
  gateway: string | null;
  dns: string[];
  ssid: string | null;
  signal_strength: number | null;
}

export interface NetworkRate {
  rx_bytes: number;
  tx_bytes: number;
  rx_rate: number;
  tx_rate: number;
}

export interface NetworkStatistics {
  total: NetworkRate;
  per_adapter: Array<{ interface: string } & NetworkRate>;
}

export interface NetworkAdaptersResult {
  adapters: NetworkAdapterInfo[];
}

export interface NetworkConnectionsResult {
  connections: NetworkConnectionInfo[];
}
