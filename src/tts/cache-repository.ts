import type { SqlExecutor } from "../notes/repository";

/*
 * Local TTS audio cache (ADR-0008): keyhash -> base64 audio. Device-local, not
 * synced — re-pays the provider per device because it can't read a shared pool;
 * the user is warned of that cost in settings. The global/shared cache (T22) is
 * a separate PocketBase store. Executor injected for unit tests.
 */

export interface CachedAudio {
  audioB64: string;
  mime: string;
}

export function createTtsCacheRepository(db: SqlExecutor, now: () => number) {
  async function get(keyhash: string): Promise<CachedAudio | null> {
    const rows = await db.select<CachedAudio>(
      `SELECT audio_b64 AS audioB64, mime FROM tts_cache WHERE keyhash = ?`,
      [keyhash],
    );
    return rows[0] ?? null;
  }

  async function put(keyhash: string, audio: CachedAudio): Promise<void> {
    await db.execute(
      `INSERT OR REPLACE INTO tts_cache (keyhash, audio_b64, mime, created_at)
       VALUES (?, ?, ?, ?)`,
      [keyhash, audio.audioB64, audio.mime, now()],
    );
  }

  return { get, put };
}

export type TtsCacheRepository = ReturnType<typeof createTtsCacheRepository>;
