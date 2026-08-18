import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { DURATION, EASE } from "$lib/ui/motion/types";

const TOKENS_PATH = fileURLToPath(
  new URL("../../src/lib/ui/styles/tokens.css", import.meta.url),
);

/**
 * Extracts `--<prefix>-*` declarations from tokens.css as
 * `Map<tokenName, value>`.
 */
function extractTokens(prefix: string): Map<string, string> {
  const css = readFileSync(TOKENS_PATH, "utf8");
  const tokens = new Map<string, string>();
  const re = new RegExp(`(${prefix}-[a-z-]+)\\s*:\\s*([^;]+);`, "g");
  for (const match of css.matchAll(re)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

describe("motion token mirrors (sync rule, ADR-0003/0009)", () => {
  it("mirrors every DURATION token as an ms value", () => {
    const tokens = extractTokens("--duration");
    for (const [key, ms] of Object.entries(DURATION)) {
      expect(tokens.get(`--duration-${key}`)).toBe(`${ms}ms`);
    }
  });

  it("mirrors every EASE token as a bezier string", () => {
    const tokens = extractTokens("--ease");
    for (const [key, value] of Object.entries(EASE)) {
      expect(tokens.get(`--ease-${key}`)).toBe(value);
    }
  });

  it("mirrors the full token set in both directions (no drift)", () => {
    const durationTokens = extractTokens("--duration");
    const easeTokens = extractTokens("--ease");
    const durationKeys = new Set(
      Object.keys(DURATION).map((key) => `--duration-${key}`),
    );
    const easeKeys = new Set(Object.keys(EASE).map((key) => `--ease-${key}`));

    for (const name of durationTokens.keys()) {
      expect(durationKeys.has(name)).toBe(true);
    }
    for (const name of easeTokens.keys()) {
      expect(easeKeys.has(name)).toBe(true);
    }
  });
});
