/**
 * Generic free-list object pool for GPU-adjacent resources (geometries,
 * textures, particle buffers). Reusing instances across frames avoids the
 * per-frame allocation churn the performance contract forbids (graphics/
 * README rule 7).
 *
 * Pooling discipline: an acquired item belongs to the caller until it is
 * released; a released item belongs to the pool — never dispose it while it is
 * free (use `disposeAll` for teardown instead).
 */

export interface ObjectPoolOptions<T> {
  /** Called on every `release`, before the item returns to the free list. */
  reset?: (item: T) => void;
  /** Pre-allocates this many instances into the free list at creation. */
  initial?: number;
  /**
   * Upper bound on the FREE list, not on allocations. The pre-warmed `initial`
   * list is clamped to `max`; when the free list is already full, `release`
   * drops the instance instead of retaining it — the caller keeps ownership of
   * disposal in that case (the pool no longer tracks it).
   */
  max?: number;
}

export interface ObjectPool<T> {
  /** Pops a pooled instance when one is free, otherwise `factory()` allocates. */
  acquire(): T;
  /**
   * Resets and returns an item to the free list; dropped when the list is full.
   *
   * Releasing an item that is already free (or was never acquired) is caller
   * undefined behaviour: a later `acquire` could hand the same instance out
   * twice.
   */
  release(item: T): void;
  /** Total instances ever created (acquired + free). */
  size(): number;
  /** Instances currently available on the free list. */
  free(): number;
  /**
   * Disposes every FREE instance (e.g. GPU geometry/texture teardown) and
   * empties the free list. Items still acquired are owned by the caller and
   * are left untouched.
   */
  disposeAll(disposer?: (item: T) => void): void;
}

export function createObjectPool<T>(
  factory: () => T,
  options: ObjectPoolOptions<T> = {},
): ObjectPool<T> {
  const { reset, initial = 0, max } = options;
  const freeList: T[] = [];
  let created = 0;

  function make(): T {
    created++;
    return factory();
  }

  // Clamp pre-warm to `max` so construction never overshoots the retention
  // bound; `max` governs the free list from the very first release cycle on.
  const prewarm = max !== undefined ? Math.min(initial, max) : initial;

  for (let i = 0; i < prewarm; i++) {
    freeList.push(make());
  }

  return {
    acquire(): T {
      const item = freeList.pop();
      // `max` bounds idle retention, not hard allocation: when the free list
      // is empty the pool still allocates a fresh instance so callers are
      // never blocked by a full pool.
      return item ?? make();
    },
    release(item: T): void {
      reset?.(item);
      if (max !== undefined && freeList.length >= max) {
        // Free list at capacity — drop the instance instead of retaining it.
        // It is no longer pooled, so the caller owns its disposal.
        return;
      }
      freeList.push(item);
    },
    size(): number {
      return created;
    },
    free(): number {
      return freeList.length;
    },
    disposeAll(disposer?: (item: T) => void): void {
      // try/finally: a throwing disposer must never leave a half-drained free
      // list with disposed instances still reachable by a later `acquire`.
      try {
        for (const item of freeList) {
          disposer?.(item);
        }
      } finally {
        freeList.length = 0;
      }
    },
  };
}
