import type { CachedAudio } from "./cache-repository";

/*
 * The opt-in GLOBAL TTS cache (ADR-0008). Entries are OWNERLESS — keyed only by
 * hash(normalizedText + language), with no user attached — which is what makes a
 * shared pool privacy-safe. Opting in is free and independent of card Storage
 * Mode: a fully-local user can still draw from (and contribute to) the shared
 * pool to lower TTS cost.
 *
 * Behind an interface so the speak flow tests without PocketBase, and so "not
 * opted in" is simply a null cache.
 */

export interface GlobalTtsCache {
  /** Look up shared audio by keyhash; null on miss. */
  get(keyhash: string): Promise<CachedAudio | null>;
  /** Contribute audio to the shared pool (ownerless). Best-effort. */
  put(keyhash: string, audio: CachedAudio): Promise<void>;
}

/** Pure in-memory global cache — the test double. */
export function inMemoryGlobalCache(seed: Record<string, CachedAudio> = {}): GlobalTtsCache {
  const store = new Map(Object.entries(seed));
  return {
    async get(k) {
      return store.get(k) ?? null;
    },
    async put(k, a) {
      store.set(k, a);
    },
  };
}
