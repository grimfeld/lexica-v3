/*
 * The request/response contract shared between the client AI transport and the
 * Cloudflare Worker AI proxy (ADR-0006). The proxy holds the app's provider keys
 * server-side (never shipped in the binary) and gates on the subscription JWT;
 * the client sends only the JWT plus the logical request. Keeping the shapes in
 * one module keeps both sides honest.
 */

/** Worker route paths. */
export const PROXY_ROUTES = {
  chat: "/api/ai/chat",
  tts: "/api/ai/tts",
  checkout: "/api/billing/checkout",
  token: "/api/billing/token",
  webhook: "/api/billing/webhook",
} as const;

export interface ProxyChatRequest {
  provider: "anthropic" | "openai";
  system: string;
  user: string;
}

export interface ProxyChatResponse {
  text: string;
}

export interface ProxyTtsRequest {
  languageId: string;
  text: string;
}

export interface ProxyTtsResponse {
  audioB64: string;
  mime: string;
}
