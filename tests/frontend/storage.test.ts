import { beforeEach, describe, expect, it } from "vitest";

import { storageGet, storageSet } from "$lib/core/utils/storage";

const PREFIX = "dex.";

function createStorageShim(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe("storageGet / storageSet", () => {
  beforeEach(() => {
    globalThis.localStorage = createStorageShim();
  });

  it("round-trips a JSON value under a namespaced key", () => {
    storageSet("theme", "dark");
    expect(globalThis.localStorage.getItem(PREFIX + "theme")).toBe('"dark"');
    expect(storageGet<string>("theme")).toBe("dark");
  });

  it("round-trips structured values", () => {
    storageSet("widgets", { active: [{ id: "a", kind: "clock" }] });
    expect(storageGet("widgets")).toEqual({ active: [{ id: "a", kind: "clock" }] });
  });

  it("returns null for a missing key", () => {
    expect(storageGet("missing")).toBeNull();
  });

  it("returns null for corrupted JSON without throwing", () => {
    globalThis.localStorage.setItem(PREFIX + "broken", "{not json");
    expect(storageGet("broken")).toBeNull();
  });

  it("survives a throwing storage backend", () => {
    globalThis.localStorage = {
      setItem() {
        throw new Error("quota exceeded");
      },
      getItem() {
        throw new Error("unavailable");
      },
      removeItem() {},
      clear() {},
      key: () => null,
      get length() {
        return 0;
      },
    } as Storage;
    expect(() => storageSet("theme", "dark")).not.toThrow();
    expect(storageGet("theme")).toBeNull();
  });
});
