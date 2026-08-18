/**
 * System domain types — mirror the zod schemas in `core/api/commands.ts`.
 */

export interface ProviderStatus {
  id: string;
  name: string;
  state: string;
  health: string;
}

export interface CpuInfo {
  model: string;
  cores: number;
  usage_percent: number;
  frequency_mhz: number;
}

export interface MemoryInfo {
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  usage_percent: number;
  swap_total_bytes: number;
  swap_used_bytes: number;
}

export interface DiskInfo {
  name: string;
  mount_point: string;
  total_bytes: number;
  available_bytes: number;
  usage_percent: number;
}

export interface BatteryInfo {
  present: boolean;
  percent: number;
  charging: boolean;
  remaining_secs: number | null;
}

export interface SystemSnapshot {
  hostname: string;
  os_name: string;
  os_version: string;
  kernel: string;
  uptime_secs: number;
  cpu: CpuInfo;
  memory: MemoryInfo;
  disks: DiskInfo[];
  battery: BatteryInfo;
  providers: ProviderStatus[];
}

/** Payload of the `dex.system.resources` event. */
export interface SystemResources {
  cpu_percent: number;
  memory: MemoryInfo;
  uptime_secs: number;
  generated_at: number;
}

/** Payload of the `dex.system.battery` event. */
export interface BatteryStatus {
  percent: number;
  charging: boolean;
  remaining_secs: number | null;
}
