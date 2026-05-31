import type { ChatClient } from "./chat";
import type { TtsClient } from "../tts/client";
import {
  PROXY_ROUTES,
  type ProxyChatRequest,
  type ProxyChatResponse,
  type ProxyTtsRequest,
  type ProxyTtsResponse,
} from "./proxy-contract";

/*
 * App-key AI clients that route through the Cloudflare Worker proxy (ADR-0006).
 * The client never sees an app provider key — it sends the subscription JWT and
 * the logical request; the Worker holds the keys and gates on the token. These
 * satisfy the same ChatClient / TtsClient interfaces as the BYOK clients, so the
 * rest of the app (authoring assist, IPA, TTS) is agnostic to which path is used.
 */

async function postProxy<TReq, TRes>(
  workerUrl: string,
  route: string,
  token: string,
  body: TReq,
): Promise<TRes> {
  const res = await fetch(`${workerUrl}${route}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Proxy ${res.status}: ${await res.text()}`);
  return (await res.json()) as TRes;
}

export function proxyChatClient(
  workerUrl: string,
  token: string,
  provider: "anthropic" | "openai",
): ChatClient {
  return {
    async complete({ system, user }) {
      const res = await postProxy<ProxyChatRequest, ProxyChatResponse>(
        workerUrl,
        PROXY_ROUTES.chat,
        token,
        { provider, system, user },
      );
      return res.text;
    },
  };
}

export function proxyTtsClient(workerUrl: string, token: string): TtsClient {
  return {
    async synthesize(languageId, text) {
      const res = await postProxy<ProxyTtsRequest, ProxyTtsResponse>(
        workerUrl,
        PROXY_ROUTES.tts,
        token,
        { languageId, text },
      );
      return { audioB64: res.audioB64, mime: res.mime };
    },
  };
}
