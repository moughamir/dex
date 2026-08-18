import { describe, expect, it } from "vitest";

import { EVENTS } from "$lib/core/api/events";

const EVENT_NAME = /^dex\.[a-z_]+\.[a-z_]+$/;

describe("EVENTS registry", () => {
  it("declares a non-empty set of events", () => {
    expect(Object.keys(EVENTS).length).toBeGreaterThan(0);
  });

  it("uses the dex.<domain>.<event> naming contract", () => {
    for (const name of Object.keys(EVENTS)) {
      expect(name).toMatch(EVENT_NAME);
    }
  });

  it("assigns each event a zod schema", () => {
    for (const [name, schema] of Object.entries(EVENTS)) {
      expect(schema, `event '${name}'`).toBeDefined();
      expect(typeof schema.parse).toBe("function");
    }
  });
});

describe("event payload schemas", () => {
  it("accepts a canonical system.resources payload", () => {
    const result = EVENTS["dex.system.resources"].safeParse({
      cpu_percent: 42.5,
      memory: {
        total_bytes: 16_000_000_000,
        used_bytes: 8_000_000_000,
        available_bytes: 8_000_000_000,
        usage_percent: 50,
      },
      uptime_secs: 3600,
      generated_at: 1_700_000_000_000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed system.resources payload (missing fields)", () => {
    const result = EVENTS["dex.system.resources"].safeParse({
      cpu_percent: 42.5,
      generated_at: 1_700_000_000_000,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a canonical process.exited payload", () => {
    const result = EVENTS["dex.process.exited"].safeParse({
      pid: 1234,
      exit_code: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a canonical settings.changed payload", () => {
    const result = EVENTS["dex.settings.changed"].safeParse({
      settings: {
        refresh_interval_ms: 1000,
        launch_on_start: false,
        reduce_motion: true,
        theme: "cyber",
      },
    });
    expect(result.success).toBe(true);
  });
});
