import type { ProviderStatus } from "./system";

export interface AppBootState {
  booted: boolean;
  booting: boolean;
  error: string | null;
  startedAt: number | null;
  providerStatuses: ProviderStatus[];
}

export const DEFAULT_BOOT_STATE: AppBootState = {
  booted: false,
  booting: false,
  error: null,
  startedAt: null,
  providerStatuses: [],
};
