/*
 * BYOK key storage. The key is a secret: it must never enter the synced SQLite
 * (ADR-0010 tables sync to cloud) nor the backup bundle. So it lives in a
 * separate, OS-encrypted vault (Stronghold) — see ./stronghold-keystore. The
 * backend is injected behind this interface so the manager and the settings UI
 * unit-test without Tauri, mirroring the SqlExecutor pattern.
 *
 * Keys are addressed by provider id (./providers). A trimmed empty string is
 * treated as "no key" — setting it clears.
 */

export interface KeyStoreBackend {
  get(providerId: string): Promise<string | null>;
  set(providerId: string, key: string): Promise<void>;
  remove(providerId: string): Promise<void>;
}

/**
 * @param knownProviderIds the universe of provider ids to probe when reporting
 *   which providers have keys — Stronghold's store can't enumerate keys, so the
 *   manager probes a known set instead.
 */
export function createKeyStore(backend: KeyStoreBackend, knownProviderIds: string[]) {
  async function setKey(providerId: string, key: string): Promise<void> {
    const trimmed = key.trim();
    if (trimmed === "") {
      await backend.remove(providerId);
      return;
    }
    await backend.set(providerId, trimmed);
  }

  async function clearKey(providerId: string): Promise<void> {
    await backend.remove(providerId);
  }

  async function getKey(providerId: string): Promise<string | null> {
    const k = await backend.get(providerId);
    return k && k.trim() !== "" ? k : null;
  }

  async function hasKey(providerId: string): Promise<boolean> {
    return (await getKey(providerId)) !== null;
  }

  /** Provider ids with a key, for the settings UI to show status without leaking values. */
  async function providersWithKeys(): Promise<string[]> {
    const present = await Promise.all(
      knownProviderIds.map(async (id) => ((await hasKey(id)) ? id : null)),
    );
    return present.filter((id): id is string => id !== null);
  }

  return { setKey, clearKey, getKey, hasKey, providersWithKeys };
}

export type KeyStore = ReturnType<typeof createKeyStore>;

/** Pure in-memory backend — the test double and a usable fallback in browser dev. */
export function inMemoryBackend(seed?: Record<string, string>): KeyStoreBackend {
  const store = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    async get(id) {
      return store.get(id) ?? null;
    },
    async set(id, key) {
      store.set(id, key);
    },
    async remove(id) {
      store.delete(id);
    },
  };
}
