/**
 * The motion driver — the only seam over the Web Animations API.
 *
 * `ui/motion/` is a rAF-free engine: it never schedules its own frame loop —
 * the renderer stays the sole continuous-loop owner (ADR-0008). JS-orchestrated
 * sequences are driven through `Element.animate`; interaction states stay
 * CSS-transition-driven.
 */

export interface MotionHandle {
  cancel(): void;
  finish(): void;
  readonly finished: Promise<void>;
}

export interface MotionDriver {
  animate(
    el: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ): MotionHandle;
  setVar(name: `--${string}`, value: string): void;
}

function stubHandle(): MotionHandle {
  return {
    cancel: () => {},
    finish: () => {},
    finished: Promise.resolve(),
  };
}

function getDocument(doc?: Document): Document | null {
  if (doc) return doc;
  return typeof document !== "undefined" ? document : null;
}

/**
 * Creates the production driver over `Element.animate`.
 *
 * When `Element.animate` is unavailable (old jsdom, non-standard hosts) the
 * driver returns an already-finished stub handle so callers never await a
 * promise that cannot settle. `setVar` writes onto the document root so
 * pointer motion reaches the CSS custom-property consumers.
 */
export function createWebDriver(doc?: Document): MotionDriver {
  const root = getDocument(doc);
  return {
    animate(el, keyframes, options) {
      if (typeof el.animate !== "function") return stubHandle();
      let animation: Animation | null = null;
      try {
        animation = el.animate(keyframes, options);
      } catch {
        // Broken keyframes/options or a suspended host: degrade to done.
        return stubHandle();
      }
      const finished = animation.finished.then(() => undefined);
      return {
        cancel: () => animation?.cancel(),
        finish: () => animation?.finish(),
        finished,
      };
    },
    setVar(name, value) {
      root?.documentElement.style.setProperty(name, value);
    },
  };
}
