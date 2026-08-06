export type PluginStatus = "installed" | "enabled" | "disabled" | "error";

export interface PluginInfo {
  id: string;
  name: string;
  version: string | null;
  description: string | null;
  enabled: boolean;
  status: PluginStatus;
  error: string | null;
}