import { describe, expect, it, vi } from "vitest";

import { createObjectPool } from "$lib/graphics/core";

describe("createObjectPool", () => {
  it("acquire returns instances from the factory", () => {
    const pool = createObjectPool(() => ({ id: Math.random() }));
    const first = pool.acquire();
    const second = pool.acquire();

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first).not.toBe(second);
    expect(pool.size()).toBe(2);
    expect(pool.free()).toBe(0);
  });

  it("release → acquire reuses the same released instance (identity)", () => {
    const pool = createObjectPool(() => ({}));
    const item = pool.acquire();

    pool.release(item);
    expect(pool.free()).toBe(1);

    expect(pool.acquire()).toBe(item);
    expect(pool.free()).toBe(0);
  });

  it("reset is called with the item on release", () => {
    const reset = vi.fn();
    const pool = createObjectPool(() => ({ value: 0 }), { reset });
    const item = pool.acquire();
    item.value = 42;

    pool.release(item);

    expect(reset).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledWith(item);
  });

  it("initial pre-warms the free list", () => {
    const factory = vi.fn(() => ({}));
    const pool = createObjectPool(factory, { initial: 3 });

    expect(factory).toHaveBeenCalledTimes(3);
    expect(pool.free()).toBe(3);
    expect(pool.size()).toBe(3);
  });

  it("initial pre-warm is clamped to max", () => {
    const factory = vi.fn(() => ({}));
    const pool = createObjectPool(factory, { initial: 5, max: 2 });

    expect(factory).toHaveBeenCalledTimes(2);
    expect(pool.free()).toBe(2);
    expect(pool.size()).toBe(2);
  });

  it("max bounds the free list, not allocations", () => {
    const pool = createObjectPool(() => ({}), { max: 2 });
    const first = pool.acquire();
    const second = pool.acquire();
    const third = pool.acquire(); // still allocates past `max`

    expect(pool.size()).toBe(3);

    pool.release(first);
    pool.release(second);
    pool.release(third); // free list is full — this one is dropped

    expect(pool.free()).toBe(2);

    // Acquires now come from the two retained instances, never the dropped one.
    const reusedFirst = pool.acquire();
    const reusedSecond = pool.acquire();
    expect([first, second, third]).toContain(reusedFirst);
    expect([first, second, third]).toContain(reusedSecond);
    expect(reusedFirst).not.toBe(reusedSecond);
    expect(pool.free()).toBe(0);
  });

  it("disposeAll calls the disposer for each pooled item and clears", () => {
    const disposer = vi.fn();
    const pool = createObjectPool(() => ({}), { initial: 2 });
    const acquired = pool.acquire();
    pool.release(acquired);
    expect(pool.free()).toBe(2); // one pre-warmed instance + the released one

    pool.disposeAll(disposer);

    expect(disposer).toHaveBeenCalledTimes(2);
    expect(pool.free()).toBe(0);
    expect(pool.size()).toBe(2); // size tracks created, not retained
  });

  it("disposeAll without a disposer still clears the free list", () => {
    const pool = createObjectPool(() => ({}), { initial: 2 });
    pool.disposeAll();
    expect(pool.free()).toBe(0);
  });

  it("disposeAll clears the free list even when the disposer throws", () => {
    const pool = createObjectPool(() => ({}), { initial: 2 });
    const disposer = vi
      .fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error("boom");
      });

    expect(() => pool.disposeAll(disposer)).toThrow("boom");
    // try/finally guarantees the drain empties the list on a throwing
    // disposer, so a later acquire can never resurrect a disposed instance.
    expect(pool.free()).toBe(0);
    expect(pool.acquire()).toBeDefined();
    expect(pool.size()).toBe(3); // fresh allocation, not a disposed item
  });

  it("size/free bookkeeping stays correct across acquire/release cycles", () => {
    const pool = createObjectPool(() => ({}), { initial: 2 });
    expect(pool.size()).toBe(2);
    expect(pool.free()).toBe(2);

    const item = pool.acquire();
    expect(pool.size()).toBe(2);
    expect(pool.free()).toBe(1);

    pool.release(item);
    expect(pool.size()).toBe(2);
    expect(pool.free()).toBe(2);
  });
});
