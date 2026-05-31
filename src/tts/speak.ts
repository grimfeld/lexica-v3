import { ttsKey } from "./key";
import type { CachedAudio, TtsCacheRepository } from "./cache-repository";
import type { TtsClient } from "./client";
import type { GlobalTtsCache } from "./global-cache";

/*
 * Cache-first TTS resolution (ADR-0008). Tiers, cheapest first:
 *   1. local cache  — private, on device
 *   2. global cache — opt-in, ownerless, shared (lowers cost); null if not opted in
 *   3. synthesize   — ElevenLabs (BYOK), then populate local + global
 * A global hit is also written to the local cache so repeat plays are instant.
 * Returns the audio for the caller to play; playback is a separate concern.
 * All deps injected so this stays testable without PocketBase or a key.
 */

export interface SpeakDeps {
  cache: Pick<TtsCacheRepository, "get" | "put">;
  /** The synth client, or null when no ElevenLabs key is configured. */
  client: TtsClient | null;
  /** The shared cache, or null/absent when the user hasn't opted into it. */
  global?: GlobalTtsCache | null;
}

export interface SpeakResult {
  ok: boolean;
  audio?: CachedAudio;
  source?: "local" | "global" | "synth";
  /** True when served from any cache tier (local or global). */
  fromCache?: boolean;
  error?: string;
}

export async function resolveSpeech(
  languageId: string,
  text: string,
  deps: SpeakDeps,
): Promise<SpeakResult> {
  if (text.trim() === "") return { ok: false, error: "Nothing to speak." };

  const key = ttsKey(languageId, text);

  const local = await deps.cache.get(key);
  if (local) return { ok: true, audio: local, source: "local", fromCache: true };

  // Opt-in shared pool (ownerless). A hit seeds the local cache too.
  if (deps.global) {
    const shared = await deps.global.get(key);
    if (shared) {
      await deps.cache.put(key, shared);
      return { ok: true, audio: shared, source: "global", fromCache: true };
    }
  }

  if (!deps.client) return { ok: false, error: "Add an ElevenLabs key in Settings." };

  try {
    const audio = await deps.client.synthesize(languageId, text);
    await deps.cache.put(key, audio);
    // Contribute to the shared pool when opted in (best-effort).
    if (deps.global) {
      try {
        await deps.global.put(key, audio);
      } catch {
        // a failed contribution must not break local playback
      }
    }
    return { ok: true, audio, source: "synth", fromCache: false };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "TTS failed." };
  }
}
