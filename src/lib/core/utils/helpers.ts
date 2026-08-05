import { isTauri as isTauriRuntime } from "@tauri-apps/api/core";
import { nanoid } from "nanoid";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type Debounced<A extends unknown[]> = ((...args: A) => void) & {
  cancel(): void;
};

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, ms);
  };
  debounced.cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  return debounced;
}

/**
 * True when running inside the Tauri webview. Wrapped in try/catch so a
 * transport failure can never take the shell down — outside Tauri it is
 * simply false (browser dev / tests).
 */
export function isTauri(): boolean {
  try {
    return isTauriRuntime();
  } catch {
    return false;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function uid(): string {
  return nanoid();
}