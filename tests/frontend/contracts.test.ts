import { describe, expect, it } from "vitest";
import { z } from "zod";

import { COMMANDS, SettingsSchema, defineCommand } from "$lib/core/api/commands";

describe("COMMANDS registry", () => {
  it("declares a non-empty set of uniquely named commands", () => {
    const names = Object.values(COMMANDS).map((command) => command.name);
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });

  it("uses snake_case command names (the Rust wire authority)", () => {
    for (const command of Object.values(COMMANDS)) {
      expect(command.name).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it("defines both an args and a result schema per command", () => {
    for (const command of Object.values(COMMANDS)) {
      expect(command.args).toBeDefined();
      expect(command.result).toBeDefined();
    }
  });
});

describe("defineCommand", () => {
  it("rejects duplicate registrations", () => {
    defineCommand("_test_dup", z.object({}), z.null());
    expect(() => defineCommand("_test_dup", z.object({}), z.null())).toThrow(
      /Duplicate command contract/,
    );
  });
});

describe("SettingsSchema", () => {
  it("accepts a canonical settings payload", () => {
    const result = SettingsSchema.safeParse({
      refresh_interval_ms: 1000,
      launch_on_start: false,
      reduce_motion: true,
      theme: "dark",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown theme (mirrors config/theme.ts ThemeName)", () => {
    const result = SettingsSchema.safeParse({
      refresh_interval_ms: 1000,
      launch_on_start: false,
      reduce_motion: true,
      theme: "sepia",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const result = SettingsSchema.safeParse({
      refresh_interval_ms: 1000,
      launch_on_start: false,
    });
    expect(result.success).toBe(false);
  });
});
