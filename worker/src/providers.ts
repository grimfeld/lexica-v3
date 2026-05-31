import type { ProxyChatRequest, ProxyTtsRequest } from "../../src/ai/proxy-contract";

/*
 * Server-side provider calls for the AI proxy. The app's keys live in Worker
 * secrets (env) and NEVER reach the client (ADR-0006) — that's the whole point
 * of the proxy. Voice/model for TTS are app-fixed per language, mirrored from
 * the client config; kept here so the Worker is self-contained.
 */

export interface ProviderEnv {
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
}

const CHAT_MODELS: Record<string, string> = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-4o-mini",
};

// App-fixed voices (mirror of src/tts/voices.ts) — multilingual default + a few.
const VOICES: Record<string, { voiceId: string; modelId: string }> = {
  es: { voiceId: "VR6AewLTigWG4xSOukaG", modelId: "eleven_multilingual_v2" },
  fr: { voiceId: "ThT5KcBeYPX3keUQqHPh", modelId: "eleven_multilingual_v2" },
};
const DEFAULT_VOICE = { voiceId: "21m00Tcm4TlvDq8ikWAM", modelId: "eleven_multilingual_v2" };

export async function proxyChat(req: ProxyChatRequest, env: ProviderEnv): Promise<string> {
  if (req.provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODELS.anthropic,
        max_tokens: 1024,
        system: req.system,
        messages: [{ role: "user", content: req.user }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const data = (await res.json()) as { content: { text?: string }[] };
    return data.content.map((b) => b.text ?? "").join("");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODELS.openai,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

export async function proxyTts(
  req: ProxyTtsRequest,
  env: ProviderEnv,
): Promise<{ audioB64: string; mime: string }> {
  const { voiceId, modelId } = VOICES[req.languageId] ?? DEFAULT_VOICE;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": env.ELEVENLABS_API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({ text: req.text, model_id: modelId }),
  });
  if (!res.ok) throw new Error(`elevenlabs ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return { audioB64: btoa(bin), mime: "audio/mpeg" };
}
