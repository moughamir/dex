import { z } from "zod";

/**
 * IPC contract layer — ADR-0002.
 *
 * Every callable Tauri command is described by one CommandContract: a command
 * name plus zod schemas for its args and result. `invoke` (core/api/tauri.ts)
 * validates both edges; the Rust side validates via serde. A command is not
 * callable until it is listed here AND registered in the Rust invoke_handler
 * (src-tauri/src/lib.rs).
 *
 * All wire keys are snake_case. Enums use `z.enum` with exactly the strings
 * the Rust side serializes. Shared shapes are declared once and reused by
 * both the command results and the event payloads.
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

/* -------------------------------------------------------------------------- */
/* Shared shapes                                                              */
/* -------------------------------------------------------------------------- */

export const SettingsSchema = z.object({
  refresh_interval_ms: z.number(),
  launch_on_start: z.boolean(),
  reduce_motion: z.boolean(),
  // Order/values mirror config/theme.ts ThemeName ("dark" | "cyber" | "light").
  theme: z.enum(["dark", "cyber", "light"]),
});

export const ProcessInfoSchema = z.object({
  pid: z.number(),
  parent_pid: z.number().nullable(),
  name: z.string(),
  executable: z.string().nullable(),
  command: z.array(z.string()),
  command_line: z.string(),
  user: z.string().nullable(),
  state: z.enum([
    "unknown",
    "running",
    "sleeping",
    "waiting",
    "stopped",
    "zombie",
    "dead",
  ]),
  priority: z.enum([
    "idle",
    "below_normal",
    "normal",
    "above_normal",
    "high",
    "realtime",
  ]),
  cpu_percent: z.number(),
  memory_bytes: z.number(),
  virtual_memory_bytes: z.number(),
  disk_read_bytes: z.number(),
  disk_write_bytes: z.number(),
  network_rx_bytes: z.number(),
  network_tx_bytes: z.number(),
  threads: z.number(),
  open_files: z.number().nullable(),
  uptime_secs: z.number(),
  children: z.array(z.number()),
});

export const NetworkAdapterInfoSchema = z.object({
  id: z.string(),
  interface: z.string(),
  name: z.string(),
  mac_address: z.string().nullable(),
  kind: z.enum([
    "unknown",
    "ethernet",
    "wireless",
    "cellular",
    "bluetooth",
    "loopback",
    "virtual",
  ]),
  state: z.enum([
    "unknown",
    "disabled",
    "disconnected",
    "connecting",
    "connected",
    "disconnecting",
    "failed",
  ]),
  speed_mbps: z.number().nullable(),
  driver: z.string().nullable(),
  enabled: z.boolean(),
  ipv4: z.array(z.string()),
  ipv6: z.array(z.string()),
  gateway: z.string().nullable(),
  dns: z.array(z.string()),
  routes: z.array(
    z.object({
      destination: z.string(),
      gateway: z.string().nullable(),
      netmask: z.string().nullable(),
      interface: z.string(),
    }),
  ),
  rx_bytes: z.number(),
  tx_bytes: z.number(),
  rx_rate: z.number(),
  tx_rate: z.number(),
});

export const NetworkConnectionInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  adapter_id: z.string(),
  state: z.enum([
    "unknown",
    "disconnected",
    "connecting",
    "connected",
    "disconnecting",
    "failed",
  ]),
  ipv4: z.string().nullable(),
  ipv6: z.string().nullable(),
  gateway: z.string().nullable(),
  dns: z.array(z.string()),
  ssid: z.string().nullable(),
  signal_strength: z.number().nullable(),
});

export const NetworkStatisticsSchema = z.object({
  total: z.object({
    rx_bytes: z.number(),
    tx_bytes: z.number(),
    rx_rate: z.number(),
    tx_rate: z.number(),
  }),
  per_adapter: z.array(
    z.object({
      interface: z.string(),
      rx_bytes: z.number(),
      tx_bytes: z.number(),
      rx_rate: z.number(),
      tx_rate: z.number(),
    }),
  ),
});

export const ModemInfoSchema = z.object({
  id: z.string(),
  manufacturer: z.string(),
  model: z.string(),
  device: z.string(),
  imei: z.string().nullable(),
  operator: z.string().nullable(),
  technology: z.enum([
    "unknown",
    "gsm",
    "gprs",
    "edge",
    "umts",
    "hspa",
    "hspa_plus",
    "lte",
    "nr_5g",
  ]),
  state: z.enum([
    "unknown",
    "disabled",
    "initializing",
    "searching",
    "registered",
    "connecting",
    "connected",
    "disconnecting",
    "failed",
  ]),
  signal: z.object({
    quality: z.number(),
    rssi: z.number().nullable(),
    rsrp: z.number().nullable(),
    rsrq: z.number().nullable(),
    sinr: z.number().nullable(),
  }),
  sim: z
    .object({
      iccid: z.string().nullable(),
      imsi: z.string().nullable(),
      operator: z.string().nullable(),
      mcc: z.string().nullable(),
      mnc: z.string().nullable(),
      number: z.string().nullable(),
      state: z.enum([
        "unknown",
        "absent",
        "locked",
        "pin_required",
        "puk_required",
        "ready",
        "error",
      ]),
    })
    .nullable(),
  bearer: z
    .object({
      apn: z.string().nullable(),
      ipv4: z.string().nullable(),
      ipv6: z.string().nullable(),
    })
    .nullable(),
  registered: z.boolean(),
});

export const WidgetPlacementSchema = z.object({
  id: z.string(),
  kind: z.string(),
  column: z.number(),
  row: z.number(),
  width: z.number(),
  height: z.number(),
});

export const WidgetLayoutSchema = z.object({
  active: z.array(WidgetPlacementSchema),
});

/* -------------------------------------------------------------------------- */
/* Command-specific schemas                                                  */
/* -------------------------------------------------------------------------- */

const SystemSnapshotSchema = z.object({
  hostname: z.string(),
  os_name: z.string(),
  os_version: z.string(),
  kernel: z.string(),
  uptime_secs: z.number(),
  cpu: z.object({
    model: z.string(),
    cores: z.number(),
    usage_percent: z.number(),
    frequency_mhz: z.number(),
  }),
  memory: z.object({
    total_bytes: z.number(),
    used_bytes: z.number(),
    available_bytes: z.number(),
    usage_percent: z.number(),
    swap_total_bytes: z.number(),
    swap_used_bytes: z.number(),
  }),
  disks: z.array(
    z.object({
      name: z.string(),
      mount_point: z.string(),
      total_bytes: z.number(),
      available_bytes: z.number(),
      usage_percent: z.number(),
    }),
  ),
  battery: z.object({
    present: z.boolean(),
    percent: z.number(),
    charging: z.boolean(),
    remaining_secs: z.number().nullable(),
  }),
  providers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      state: z.string(),
      health: z.string(),
    }),
  ),
});

const ProcessListArgsSchema = z.object({
  search: z.string().nullable().optional(),
  sort_by: z.enum(["cpu", "memory", "name", "pid"]).nullable().optional(),
  sort_dir: z.enum(["asc", "desc"]).nullable().optional(),
  filter: z
    .enum(["all", "running", "sleeping", "zombie"])
    .nullable()
    .optional(),
});

const ProcessListResultSchema = z.object({
  processes: z.array(ProcessInfoSchema),
  total: z.number(),
  generated_at: z.number(),
});

const ProcessSpawnArgsSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
  cwd: z.string().nullable().optional(),
  env: z.record(z.string(), z.string()).nullable().optional(),
});

const NetworkAdaptersResultSchema = z.object({
  adapters: z.array(NetworkAdapterInfoSchema),
});

const NetworkConnectionsResultSchema = z.object({
  connections: z.array(NetworkConnectionInfoSchema),
});

const ModemListResultSchema = z.object({
  modems: z.array(ModemInfoSchema),
});

const WidgetsAvailableResultSchema = z.object({
  widgets: z.array(
    z.object({
      kind: z.string(),
      name: z.string(),
      description: z.string(),
      default_size: z.object({ width: z.number(), height: z.number() }),
    }),
  ),
});

const TerminalSpawnArgsSchema = z.object({
  shell: z.string().nullable().optional(),
  cwd: z.string().nullable().optional(),
  cols: z.number().nullable().optional(),
  rows: z.number().nullable().optional(),
});

const PluginsListResultSchema = z.object({
  plugins: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      version: z.string().nullable(),
      description: z.string().nullable(),
      enabled: z.boolean(),
      status: z.enum(["installed", "enabled", "disabled", "error"]),
      error: z.string().nullable(),
    }),
  ),
});

const HistoryListArgsSchema = z.object({
  limit: z.number().nullable().optional(),
});

const HistoryListResultSchema = z.object({
  entries: z.array(
    z.object({
      id: z.number(),
      kind: z.string(),
      title: z.string(),
      detail: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
});

/**
 * Registry of all IPC commands. Adding a command:
 *   1. Rust: src-tauri/src/commands/<domain>.rs + invoke_handler in lib.rs
 *   2. TS:   add its contract here
 *   3. TS:   expose a typed function in core/services/<domain>.ts
 */
export const COMMANDS = {
  systemSnapshot: defineCommand(
    "system_snapshot",
    z.object({}),
    SystemSnapshotSchema,
  ),
  processList: defineCommand(
    "process_list",
    ProcessListArgsSchema,
    ProcessListResultSchema,
  ),
  processDetails: defineCommand(
    "process_details",
    z.object({ pid: z.number() }),
    ProcessInfoSchema,
  ),
  processTerminate: defineCommand(
    "process_terminate",
    z.object({ pid: z.number(), signal: z.enum(["terminate", "kill"]) }),
    z.null(),
  ),
  processSpawn: defineCommand(
    "process_spawn",
    ProcessSpawnArgsSchema,
    z.object({ pid: z.number(), task_id: z.string() }),
  ),
  networkAdapters: defineCommand(
    "network_adapters",
    z.object({}),
    NetworkAdaptersResultSchema,
  ),
  networkConnections: defineCommand(
    "network_connections",
    z.object({}),
    NetworkConnectionsResultSchema,
  ),
  networkStatistics: defineCommand(
    "network_statistics",
    z.object({}),
    NetworkStatisticsSchema,
  ),
  networkSetEnabled: defineCommand(
    "network_set_enabled",
    z.object({ interface: z.string(), enabled: z.boolean() }),
    z.null(),
  ),
  modemList: defineCommand("modem_list", z.object({}), ModemListResultSchema),
  modemDetails: defineCommand(
    "modem_details",
    z.object({ id: z.string() }),
    ModemInfoSchema,
  ),
  settingsGet: defineCommand("settings_get", z.object({}), SettingsSchema),
  settingsSet: defineCommand(
    "settings_set",
    z.object({ settings: SettingsSchema }),
    SettingsSchema,
  ),
  settingsReset: defineCommand("settings_reset", z.object({}), SettingsSchema),
  widgetsAvailable: defineCommand(
    "widgets_available",
    z.object({}),
    WidgetsAvailableResultSchema,
  ),
  widgetsLayoutGet: defineCommand(
    "widgets_layout_get",
    z.object({}),
    WidgetLayoutSchema,
  ),
  widgetsLayoutSet: defineCommand(
    "widgets_layout_set",
    z.object({ layout: WidgetLayoutSchema }),
    z.null(),
  ),
  terminalSpawn: defineCommand(
    "terminal_spawn",
    TerminalSpawnArgsSchema,
    z.object({ id: z.string(), pid: z.number() }),
  ),
  terminalInput: defineCommand(
    "terminal_input",
    z.object({ id: z.string(), data: z.string() }),
    z.null(),
  ),
  terminalResize: defineCommand(
    "terminal_resize",
    z.object({ id: z.string(), cols: z.number(), rows: z.number() }),
    z.null(),
  ),
  terminalKill: defineCommand(
    "terminal_kill",
    z.object({ id: z.string() }),
    z.null(),
  ),
  pluginsList: defineCommand(
    "plugins_list",
    z.object({}),
    PluginsListResultSchema,
  ),
  pluginsSetEnabled: defineCommand(
    "plugins_set_enabled",
    z.object({ id: z.string(), enabled: z.boolean() }),
    z.null(),
  ),
  historyList: defineCommand(
    "history_list",
    HistoryListArgsSchema,
    HistoryListResultSchema,
  ),
} as const;
