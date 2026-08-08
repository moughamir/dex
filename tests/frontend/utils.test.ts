import { describe, expect, it } from "vitest";

import {
  formatBytes,
  formatDuration,
  formatFrequency,
  formatNumber,
  formatPercent,
  formatUptime,
} from "$lib/core/utils/format";
import {
  formatDate,
  formatRelativeTime,
  formatTime,
  timeAgo,
} from "$lib/core/utils/date";

describe("formatBytes", () => {
  it("formats byte magnitudes with 1024-based units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(1536)).toBe("1.50 KB");
    expect(formatBytes(1048576)).toBe("1.00 MB");
    expect(formatBytes(5 * 1024 ** 3)).toBe("5.00 GB");
  });

  it("clamps to the largest unit and guards invalid input", () => {
    expect(formatBytes(2 * 1024 ** 5)).toBe("2048.00 TB");
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
  });
});

describe("formatPercent", () => {
  it("rounds to one decimal place", () => {
    expect(formatPercent(50)).toBe("50%");
    expect(formatPercent(33.33)).toBe("33.3%");
    expect(formatPercent(0)).toBe("0%");
  });

  it("guards invalid input", () => {
    expect(formatPercent(Number.NaN)).toBe("0%");
  });
});

describe("formatUptime / formatDuration", () => {
  it("formats seconds into a compact human duration", () => {
    expect(formatUptime(0)).toBe("0s");
    expect(formatUptime(45)).toBe("45s");
    expect(formatUptime(3661)).toBe("1h 1m");
    expect(formatUptime(90_000)).toBe("1d 1h");
  });

  it("guards invalid input", () => {
    expect(formatUptime(-5)).toBe("0s");
    expect(formatUptime(Number.NaN)).toBe("0s");
  });

  it("formatDuration converts milliseconds to seconds first", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45_000)).toBe("45s");
    expect(formatDuration(3_600_000)).toBe("1h 0m");
  });
});

describe("formatFrequency", () => {
  it("formats MHz into MHz or GHz", () => {
    expect(formatFrequency(0)).toBe("0 MHz");
    expect(formatFrequency(500)).toBe("500 MHz");
    expect(formatFrequency(2400)).toBe("2.40 GHz");
  });

  it("guards invalid input", () => {
    expect(formatFrequency(-1)).toBe("0 MHz");
  });
});

describe("formatNumber", () => {
  it("rounds to two decimals and groups thousands", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1234.567)).toBe("1,234.57");
    expect(formatNumber(12_345)).toBe("12,345");
  });

  it("guards invalid input", () => {
    expect(formatNumber(Number.NaN)).toBe("0");
  });
});

describe("timeAgo / formatRelativeTime", () => {
  const now = Date.now();

  it("labels a recent timestamp 'just now'", () => {
    expect(timeAgo(now - 1_000)).toBe("just now");
  });

  it("formats second/minute/hour/day buckets", () => {
    expect(timeAgo(now - 30_000)).toBe("30s ago");
    expect(timeAgo(now - 5 * 60_000)).toBe("5m ago");
    expect(timeAgo(now - 2 * 3_600_000)).toBe("2h ago");
    expect(timeAgo(now - 3 * 86_400_000)).toBe("3d ago");
  });

  it("treats a future or invalid timestamp as 'just now'", () => {
    expect(timeAgo(now + 60_000)).toBe("just now");
    expect(timeAgo(Number.NaN)).toBe("just now");
  });

  it("formatRelativeTime is an alias", () => {
    expect(formatRelativeTime(now - 30_000)).toBe(timeAgo(now - 30_000));
  });
});

describe("formatTime / formatDate", () => {
  // Constructed from local components so assertions hold in any TZ.
  const epoch = new Date(2026, 7, 12, 9, 5).getTime();

  it("formats HH:MM with zero padding", () => {
    expect(formatTime(epoch)).toBe("09:05");
  });

  it("formats a short date 'DD Mon YYYY'", () => {
    expect(formatDate(epoch)).toBe("12 Aug 2026");
  });
});
