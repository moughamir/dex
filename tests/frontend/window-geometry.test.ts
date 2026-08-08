import { describe, expect, it } from "vitest";

import {
  monitorEquals,
  sizeEquals,
  toLogical,
  toPhysical,
} from "$lib/core/utils/window-geometry";
import type { MonitorInfo } from "$lib/core/types/window";

describe("toLogical", () => {
  it("is the identity at scale factor 1", () => {
    expect(toLogical({ width: 1920, height: 1080 }, 1)).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("converts physical to logical at fractional and integer factors", () => {
    expect(toLogical({ width: 2880, height: 1620 }, 1.5)).toEqual({
      width: 1920,
      height: 1080,
    });
    expect(toLogical({ width: 3840, height: 2160 }, 2)).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("rounds each dimension to whole pixels", () => {
    expect(toLogical({ width: 100, height: 50 }, 1.5)).toEqual({
      width: 67,
      height: 33,
    });
  });
});

describe("toPhysical", () => {
  it("is the identity at scale factor 1", () => {
    expect(toPhysical({ width: 800, height: 600 }, 1)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("scales logical to physical at fractional and integer factors", () => {
    expect(toPhysical({ width: 800, height: 600 }, 1.5)).toEqual({
      width: 1200,
      height: 900,
    });
    expect(toPhysical({ width: 800, height: 600 }, 2)).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it("round-trips logical → physical → logical at common factors", () => {
    for (const scaleFactor of [1, 1.5, 2]) {
      const logical = { width: 800, height: 600 };
      expect(toLogical(toPhysical(logical, scaleFactor), scaleFactor)).toEqual(
        logical,
      );
    }
  });
});

describe("sizeEquals", () => {
  it("matches equal sizes", () => {
    expect(sizeEquals({ width: 10, height: 20 }, { width: 10, height: 20 })).toBe(
      true,
    );
  });

  it("rejects differing sizes", () => {
    expect(sizeEquals({ width: 10, height: 20 }, { width: 11, height: 20 })).toBe(
      false,
    );
    expect(sizeEquals({ width: 10, height: 20 }, { width: 10, height: 21 })).toBe(
      false,
    );
  });
});

describe("monitorEquals", () => {
  const monitor: MonitorInfo = {
    name: "DP-1",
    size: { width: 2560, height: 1440 },
    position: { x: 0, y: 0 },
    scaleFactor: 2,
  };

  it("matches identical monitors", () => {
    expect(monitorEquals(monitor, { ...monitor })).toBe(true);
  });

  it("matches two nulls and rejects null vs value", () => {
    expect(monitorEquals(null, null)).toBe(true);
    expect(monitorEquals(monitor, null)).toBe(false);
    expect(monitorEquals(null, monitor)).toBe(false);
  });

  it("rejects monitors differing in any field", () => {
    expect(monitorEquals(monitor, { ...monitor, name: "DP-2" })).toBe(false);
    expect(
      monitorEquals(monitor, {
        ...monitor,
        size: { width: 1920, height: 1080 },
      }),
    ).toBe(false);
    expect(
      monitorEquals(monitor, {
        ...monitor,
        position: { x: 2560, y: 0 },
      }),
    ).toBe(false);
    expect(monitorEquals(monitor, { ...monitor, scaleFactor: 1 })).toBe(false);
  });
});
