import { services } from "../services";
import { keyStore } from "../ai";
import { elevenLabsClient } from "./client";
import { resolveSpeech, type SpeakResult } from "./speak";

/*
 * Live TTS wiring (ADR-0008): resolve audio cache-first (local cache + BYOK
 * ElevenLabs synth), then play it in the webview. Playback is separated from
 * resolution so the cache-first logic stays unit-testable.
 */

async function ttsClient() {
  const key = await keyStore.getKey("elevenlabs");
  return key ? elevenLabsClient(key) : null;
}

/** Whether TTS is available (an ElevenLabs key is configured). */
export async function ttsAvailable(): Promise<boolean> {
  return keyStore.hasKey("elevenlabs");
}

function play(audioB64: string, mime: string): void {
  const audio = new Audio(`data:${mime};base64,${audioB64}`);
  void audio.play();
}

/** Speak target-language text: cache-first, synth on miss, then play. */
export async function speak(languageId: string, text: string): Promise<SpeakResult> {
  const client = await ttsClient();
  const result = await resolveSpeech(languageId, text, {
    cache: services.ttsCache,
    client,
  });
  if (result.ok && result.audio) play(result.audio.audioB64, result.audio.mime);
  return result;
}
