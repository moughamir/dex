/**
 * JSON-safe localStorage access with a namespaced prefix. The shell must
 * never crash because storage is unavailable or corrupted — every access is
 * wrapped.
 */

const PREFIX = "dex.";

export function storageGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota / availability failure: persist nothing, keep the shell alive.
  }
}
