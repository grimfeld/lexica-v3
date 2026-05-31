import { pbInstance } from "../sync/run";
import type { GlobalTtsCache } from "./global-cache";
import type { CachedAudio } from "./cache-repository";

/*
 * PocketBase-backed global TTS cache (ADR-0008). Entries are OWNERLESS: the
 * `tts_global` collection holds (keyhash, audio_b64, mime) with no user field,
 * so the shared pool never records who voiced what. Reads/writes are best-effort;
 * any error degrades gracefully to local-only synthesis. Requires a PocketBase
 * to be configured (cloud sync) — but NOT cloud card storage, per the ADR's
 * independent axes.
 */

interface GlobalRow {
  keyhash: string;
  audio_b64: string;
  mime: string;
}

export const pbGlobalCache: GlobalTtsCache = {
  async get(keyhash) {
    const pb = pbInstance();
    if (!pb) return null;
    try {
      const rec = await pb
        .collection("tts_global")
        .getFirstListItem<GlobalRow>(`keyhash = "${keyhash}"`);
      return { audioB64: rec.audio_b64, mime: rec.mime };
    } catch {
      return null; // miss or unavailable
    }
  },

  async put(keyhash, audio: CachedAudio) {
    const pb = pbInstance();
    if (!pb) return;
    // Ownerless write: no user attached. Ignore duplicates (another device may
    // have populated the same keyhash concurrently).
    await pb
      .collection("tts_global")
      .create({ keyhash, audio_b64: audio.audioB64, mime: audio.mime })
      .catch(() => undefined);
  },
};
