import { ttsKey } from "./key";
import type { CachedAudio, TtsCacheRepository } from "./cache-repository";
import type { TtsClient } from "./client";

/*
 * Cache-first TTS resolution (ADR-0008). Look up hash(text+language) in the
 * local cache; on a miss, synthesize once, store it, and return it. Returns the
 * audio (base64 + mime) for the caller to play — playback is a separate concern
 * so this stays testable without an <audio> element. Deps injected.
 */

export interface SpeakDeps {
  cache: Pick<TtsCacheRepository, "get" | "put">;
  /** The synth client, or null when no ElevenLabs key is configured. */
  client: TtsClient | null;
}

export interface SpeakResult {
  ok: boolean;
  audio?: CachedAudio;
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
  const cached = await deps.cache.get(key);
  if (cached) return { ok: true, audio: cached, fromCache: true };

  if (!deps.client) return { ok: false, error: "Add an ElevenLabs key in Settings." };

  try {
    const audio = await deps.client.synthesize(languageId, text);
    await deps.cache.put(key, audio);
    return { ok: true, audio, fromCache: false };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "TTS failed." };
  }
}
