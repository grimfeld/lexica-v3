import { voiceFor } from "./voices";

/*
 * ElevenLabs TTS client, called client-direct with the user's BYOK key
 * (ADR-0006). Voice/model are app-fixed per language (ADR-0008). Returns the
 * audio as base64 + mime so it can be cached in SQLite and played in the webview.
 * Injectable behind TtsClient so the speak flow tests without network.
 */

export interface SynthesizedAudio {
  audioB64: string;
  mime: string;
}

export interface TtsClient {
  synthesize(languageId: string, text: string): Promise<SynthesizedAudio>;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // btoa is available in the webview (and in jsdom for tests).
  return btoa(binary);
}

export function elevenLabsClient(key: string): TtsClient {
  return {
    async synthesize(languageId, text) {
      const { voiceId, modelId } = voiceFor(languageId);
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": key,
            "content-type": "application/json",
            accept: "audio/mpeg",
          },
          body: JSON.stringify({ text, model_id: modelId }),
        },
      );
      if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      return { audioB64: bytesToBase64(buf), mime: "audio/mpeg" };
    },
  };
}
