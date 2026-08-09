import {
  createWebDriver,
  type MotionDriver,
  type MotionHandle,
} from "./driver";
import { DURATION, EASE, type DurationToken, type EaseToken } from "./types";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface MotionManagerOptions {
  /** DI seam for tests; defaults to the WAAPI web driver. */
  driver?: MotionDriver;
  /**
   * DI seam for tests; falls back to `window.matchMedia`, then
   * `globalThis.matchMedia`. When no implementation exists (headless node),
   * reduced motion stays `false` and nothing is wired.
   */
  matchMedia?: typeof window.matchMedia;
}

/**
 * Animation options a caller may pass to the manager: `KeyframeAnimationOptions`
 * with the duration/easing fields re-typed as tokens — never raw numbers or
 * bezier strings (no-magic-values rule).
 */
export interface MotionAnimationOptions extends KeyframeAnimationOptions {
  duration: DurationToken;
  easing: EaseToken;
}

type PrefsListener = (reduced: boolean) => void;

/** Keyframe keys that are WAAPI metadata, not CSS properties. */
const KEYFRAME_META_KEYS = [
  "offset",
  "easing",
  "composite",
  "iterationComposite",
];

function finishedHandle(): MotionHandle {
  return {
    cancel: () => {},
    finish: () => {},
    finished: Promise.resolve(),
  };
}

/**
 * Reduced-motion handle: the element is synchronously placed at the keyframes'
 * final state (last keyframe) — enter lands fully visible, exit lands fully
 * hidden — and the handle is already finished. This is the reduced-motion
 * contract: instant appear/disappear, never a stuck mid-flight state. The
 * inline values are the landing state; a later `animate()` on the same element
 * overwrites them (reduced) or runs a full WAAPI effect (non-reduced).
 */
function reducedHandle(el: Element, keyframes: Keyframe[]): MotionHandle {
  applyFinalState(el, keyframes);
  return finishedHandle();
}

/** Applies the last keyframe's CSS values to the element's inline style. */
function applyFinalState(el: Element, keyframes: Keyframe[]): void {
  const final = keyframes[keyframes.length - 1];
  if (!final) return;
  const style = (el as { style?: CSSStyleDeclaration }).style;
  if (!style) return;
  for (const [property, value] of Object.entries(final)) {
    if (KEYFRAME_META_KEYS.includes(property)) continue;
    if (value === null || value === undefined) continue;
    const resolved = Array.isArray(value)
      ? String(value[value.length - 1] ?? "")
      : String(value);
    style.setProperty(property, resolved);
  }
}

/**
 * The single source of truth for reduced motion and the only entry point for
 * JS-orchestrated animation (ADR-0009). Consumers never touch WAAPI directly;
 * `reduced` is the manager-level gate — under reduced motion `animate()` jumps
 * to the end state and never reaches the driver.
 */
export class MotionManager {
  /** `true` when the user prefers reduced motion (or nothing is wired). */
  reduced = $state(false);

  #driver: MotionDriver;
  #matchMedia: typeof window.matchMedia | null;
  #media: MediaQueryList | null = null;
  #listener: ((event: MediaQueryListEvent) => void) | null = null;
  #listeners: PrefsListener[] = [];

  constructor(options: MotionManagerOptions = {}) {
    this.#driver = options.driver ?? createWebDriver();
    this.#matchMedia = resolveMatchMedia(options.matchMedia);
    this.#ensureMediaListener();
  }

  /**
   * Animates an element. Token values are resolved to ms / bezier strings
   * before reaching the driver. Under reduced motion the element is
   * synchronously placed at the keyframes' final state, an already-finished
   * handle is returned, and the driver is never called.
   */
  animate(
    el: Element,
    keyframes: Keyframe[],
    options: MotionAnimationOptions,
  ): MotionHandle {
    if (this.reduced) return reducedHandle(el, keyframes);
    const { duration, easing, ...rest } = options;
    return this.#driver.animate(el, keyframes, {
      ...rest,
      duration: DURATION[duration],
      easing: EASE[easing],
    });
  }

  /** Subscribes to reduced-motion preference changes. Returns an unsubscribe. */
  onPrefsChange(listener: PrefsListener): () => void {
    this.#listeners.push(listener);
    return () => {
      const index = this.#listeners.indexOf(listener);
      if (index >= 0) this.#listeners.splice(index, 1);
    };
  }

  /**
   * Pointer position, written to `--cursor-x` / `--cursor-y` on the document
   * root unless reduced motion is active.
   */
  pointer = {
    update: (x: number, y: number): void => {
      if (this.reduced) return;
      this.#driver.setVar("--cursor-x", `${x}px`);
      this.#driver.setVar("--cursor-y", `${y}px`);
    },
  };

  /**
   * Detaches the media listener and clears preference subscribers. Idempotent;
   * the app singleton lives for the process lifetime and usually never calls
   * this — it exists so tests and short-lived instances tear down cleanly.
   */
  dispose(): void {
    if (!this.#media || !this.#listener) return;
    if (typeof this.#media.removeEventListener === "function") {
      this.#media.removeEventListener("change", this.#listener);
    } else {
      const legacy = this.#media as unknown as {
        removeListener?: (
          listener: (event: MediaQueryListEvent) => void,
        ) => void;
      };
      legacy.removeListener?.(this.#listener);
    }
    this.#media = null;
    this.#listener = null;
    this.#listeners.length = 0;
  }

  #ensureMediaListener(): void {
    if (this.#media || !this.#matchMedia) return;
    const mql = this.#matchMedia(REDUCED_MOTION_QUERY);
    this.reduced = mql.matches;
    const listener = (event: MediaQueryListEvent): void => {
      this.reduced = event.matches;
      this.#listeners.forEach((emit) => emit(event.matches));
    };
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", listener);
    } else {
      const legacy = mql as unknown as {
        addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      };
      legacy.addListener?.(listener);
    }
    this.#media = mql;
    this.#listener = listener;
  }
}

function resolveMatchMedia(
  injected: typeof window.matchMedia | undefined,
): typeof window.matchMedia | null {
  if (typeof injected === "function") return injected;
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
  ) {
    // Host methods (window.matchMedia in WebKit/Blink) throw
    // "Illegal invocation" when called with a different receiver — the
    // manager calls this via `this.#matchMedia(...)`, so bind the window.
    return window.matchMedia.bind(window);
  }
  if (typeof globalThis.matchMedia === "function") {
    return globalThis.matchMedia.bind(globalThis);
  }
  return null;
}

export function createMotionManager(
  options?: MotionManagerOptions,
): MotionManager {
  return new MotionManager(options);
}

/**
 * The app-wide motion manager. Uses the default web driver; tests inject
 * driver/matchMedia via `createMotionManager` instead.
 */
export const motionManager = new MotionManager();
