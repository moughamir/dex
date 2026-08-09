/**
 * JS mirrors of the motion tokens in `src/lib/ui/styles/tokens.css`.
 *
 * Sync rule (ADR-0003 / ADR-0009): every value here must match the
 * `--duration-*` / `--ease-*` tokens in tokens.css — the motion-tokens test
 * enforces the pairing. Durations are ms integers; easings are CSS
 * timing-function strings. Consumers of `ui/motion/` speak these tokens and
 * never raw numbers or bezier strings (no-magic-values rule).
 */
export const DURATION = {
  micro: 80,
  fast: 120,
  normal: 220,
  slow: 360,
  slower: 600,
} as const;

export type DurationToken = keyof typeof DURATION;

export const EASE = {
  standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  spring: "cubic-bezier(0.18, 1.15, 0.3, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export type EaseToken = keyof typeof EASE;
