import type { Texture } from "three";

import { logWarn } from "$lib/core/utils/logger";

/**
 * App-owned, keyed, ref-counted texture cache.
 *
 * three's own Cache/TextureLoader dedupe the network *fetch*, but every
 * `load()` call still produces a brand-new `Texture` — so GPU-side dedup
 * requires caching the Texture objects ourselves. Reusing the same instance
 * for a given key keeps exactly one texture uploaded on the device.
 *
 * Lifetime discipline: a texture is valid while its refcount is above zero.
 * After the last `release` (or after `clear`) the texture is disposed — never
 * render with it afterwards.
 */

export interface TextureCacheOptions {
  /**
   * Reserved for a future retention bound. Under the current
   * release-disposes-at-zero contract the cache can never hold unreferenced
   * entries, so it is already bounded to live (referenced) textures and
   * `maxEntries` is vacuously satisfied until a bounded-retention policy lands.
   */
  maxEntries?: number;
}

export interface TextureCache {
  /**
   * Returns the cached Texture for `key` (refcount +1), or creates one via
   * `factory`, stores it, and returns it with refcount 1.
   *
   * Key discipline: `key` MUST encode every load setting that changes the GPU
   * upload — e.g. a colorSpace token (`SRGBColorSpace` for color maps vs the
   * r185 default `NoColorSpace`) and an anisotropy token — so one source loaded
   * under different settings never aliases onto a single texture.
   */
  acquire(key: string, factory: () => Texture): Texture;
  /** Releases one reference; at zero the texture is disposed and removed. */
  release(key: string, texture: Texture): void;
  /** Peeks at the cached texture without changing its refcount. */
  get(key: string): Texture | undefined;
  /**
   * Disposes EVERY entry (a caller holding references past this point is
   * responsible for their disposal) and empties the cache.
   */
  clear(): void;
  /** Number of retained entries. */
  entries(): number;
}

interface TextureCacheEntry {
  texture: Texture;
  refs: number;
}

export function createTextureCache(
  options: TextureCacheOptions = {},
): TextureCache {
  // `maxEntries` is a reserved retention bound and is not enforced today. The
  // release-disposes-at-zero contract means no unreferenced entry can ever be
  // in the map, so the cache is already bounded to live textures — see
  // `TextureCacheOptions.maxEntries`.
  void options.maxEntries;
  const cache = new Map<string, TextureCacheEntry>();

  return {
    acquire(key, factory) {
      const existing = cache.get(key);
      if (existing) {
        existing.refs++;
        return existing.texture;
      }
      const texture = factory();
      // Insert regardless of any bound: every in-map entry is referenced, so
      // evicting one would dispose a texture that is still in use.
      cache.set(key, { texture, refs: 1 });
      return texture;
    },
    release(key, texture) {
      const entry = cache.get(key);
      if (!entry || entry.texture !== texture) {
        logWarn(
          `texture-cache: release("${key}") ignored — key/texture mismatch or unknown key`,
        );
        return;
      }
      entry.refs--;
      if (entry.refs === 0) {
        cache.delete(key);
        texture.dispose();
      }
    },
    get(key) {
      return cache.get(key)?.texture;
    },
    clear() {
      for (const entry of cache.values()) {
        entry.texture.dispose();
      }
      cache.clear();
    },
    entries() {
      return cache.size;
    },
  };
}
