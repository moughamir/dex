import type { ProcessPriority, ProcessState } from "./common";

/** A single process row, shared by `process_list` / `process_details`. */
export interface ProcessInfo {
  pid: number;
  parent_pid: number | null;
  name: string;
  executable: string | null;
  command: string[];
  command_line: string;
  user: string | null;
  state: ProcessState;
  priority: ProcessPriority;
  cpu_percent: number;
  memory_bytes: number;
  virtual_memory_bytes: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
  threads: number;
  open_files: number | null;
  uptime_secs: number;
  children: number[];
}

export interface ProcessListResult {
  processes: ProcessInfo[];
  total: number;
  generated_at: number;
}
