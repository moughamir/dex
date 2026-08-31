import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";

import { logWarn } from "$lib/core/utils/logger";
import { createTextureCache } from "$lib/graphics/core";

// The logger facade pulls in @tauri-apps/plugin-log (a Rust-plugin boundary);
// stub the module so node tests exercise the cache, not the logger plumbing.
vi.mock("$lib/core/utils/logger", () => ({
  logWarn: vi.fn(),
}));

function makeTexture(): THREE.Texture {
  return new THREE.Texture();
}

describe("createTextureCache", () => {
  it("returns the same instance for the same key (factory called once)", () => {
    const cache = createTextureCache();
    const factory = vi.fn(makeTexture);

    const first = cache.acquire("a", factory);
    const second = cache.acquire("a", factory);

    expect(second).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(cache.entries()).toBe(1);
  });

  it("ref-counts: disposal happens exactly once when the last ref is released", () => {
    const cache = createTextureCache();
    const texture = new THREE.Texture();
    const dispose = vi.spyOn(texture, "dispose");

    cache.acquire("a", () => texture);
    cache.acquire("a", () => texture);
    expect(dispose).not.toHaveBeenCalled();

    cache.release("a", texture);
    expect(dispose).not.toHaveBeenCalled();
    expect(cache.get("a")).toBe(texture);

    cache.release("a", texture);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.entries()).toBe(0);
  });

  it("distinct keys yield distinct instances", () => {
    const cache = createTextureCache();
    const first = cache.acquire("a", makeTexture);
    const second = cache.acquire("b", makeTexture);

    expect(first).not.toBe(second);
    expect(cache.entries()).toBe(2);
  });

  it("get returns undefined for an unknown key", () => {
    const cache = createTextureCache();
    expect(cache.get("missing")).toBeUndefined();
    expect(cache.entries()).toBe(0);
  });

  it("maxEntries overflow inserts a new key anyway while all entries are referenced", () => {
    const cache = createTextureCache({ maxEntries: 2 });
    const a = new THREE.Texture();
    const b = new THREE.Texture();
    const c = new THREE.Texture();
    const disposeA = vi.spyOn(a, "dispose");
    const disposeB = vi.spyOn(b, "dispose");
    const disposeC = vi.spyOn(c, "dispose");

    cache.acquire("a", () => a);
    cache.acquire("b", () => b);
    // Cache is full but both entries are referenced (refs 1), so nothing is
    // evicted — an in-use texture is never disposed under a consumer. The
    // cache grows past the bound instead (documented overflow).
    cache.acquire("c", () => c);

    expect(cache.entries()).toBe(3);
    expect(disposeA).not.toHaveBeenCalled();
    expect(disposeB).not.toHaveBeenCalled();
    expect(disposeC).not.toHaveBeenCalled();

    // Releasing the overflow entry disposes it and returns to the bound.
    cache.release("c", c);
    expect(cache.entries()).toBe(2);
    expect(disposeC).toHaveBeenCalledTimes(1);
    expect(cache.get("c")).toBeUndefined();
  });

  it("clear disposes every entry and empties the cache", () => {
    const cache = createTextureCache();
    const a = new THREE.Texture();
    const b = new THREE.Texture();
    const disposeA = vi.spyOn(a, "dispose");
    const disposeB = vi.spyOn(b, "dispose");

    cache.acquire("a", () => a);
    cache.acquire("b", () => b);

    cache.clear();

    expect(disposeA).toHaveBeenCalledTimes(1);
    expect(disposeB).toHaveBeenCalledTimes(1);
    expect(cache.entries()).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });

  it("release with an unknown or mismatched key warns and does not throw", () => {
    const cache = createTextureCache();
    const texture = new THREE.Texture();
    cache.acquire("a", () => texture);

    expect(() => cache.release("missing", texture)).not.toThrow();
    expect(logWarn).toHaveBeenCalledTimes(1);

    const other = new THREE.Texture();
    expect(() => cache.release("a", other)).not.toThrow();
    expect(logWarn).toHaveBeenCalledTimes(2);

    // A failed release leaves the entry untouched.
    expect(cache.get("a")).toBe(texture);
    expect(cache.entries()).toBe(1);
  });
});
