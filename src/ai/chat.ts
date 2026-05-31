/*
 * Minimal text-completion client for BYOK chat models. Calls go directly from
 * the client to the provider with the user's stored key (ADR-0006) — never
 * through a server the app controls. The interface is injectable so the
 * authoring-assist orchestration unit-tests without network or a real key.
 *
 * The contract is deliberately tiny: a system + user prompt in, raw assistant
 * text out. Callers that need JSON ask for it in the prompt and parse/validate
 * the result themselves (see authoring-assist).
 */

export interface ChatRequest {
  system: string;
  user: string;
}

export interface ChatClient {
  complete(req: ChatRequest): Promise<string>;
}

/** Default chat model per provider for authoring assist. */
const MODELS: Record<string, string> = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-4o-mini",
};

/** Anthropic Messages API, called client-direct with the BYOK key. */
function anthropicClient(key: string): ChatClient {
  return {
    async complete({ system, user }) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          // Required for browser-origin requests (Tauri webview).
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: MODELS.anthropic,
          max_tokens: 1024,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { content: { type: string; text?: string }[] };
      return data.content.map((b) => b.text ?? "").join("");
    },
  };
}

/** OpenAI Chat Completions, called client-direct with the BYOK key. */
function openaiClient(key: string): ChatClient {
  return {
    async complete({ system, user }) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODELS.openai,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { choices: { message: { content: string } }[] };
      return data.choices[0]?.message?.content ?? "";
    },
  };
}

/** Build a client for a provider id, or null if it has no chat model. */
export function chatClientFor(providerId: string, key: string): ChatClient | null {
  if (providerId === "anthropic") return anthropicClient(key);
  if (providerId === "openai") return openaiClient(key);
  return null; // e.g. elevenlabs is TTS-only
}

/** Provider ids that can do authoring assist (have a chat model). */
export const CHAT_PROVIDERS = ["anthropic", "openai"];
