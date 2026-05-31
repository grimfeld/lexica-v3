import { isTauri } from "@tauri-apps/api/core";
import { createKeyStore, inMemoryBackend, type KeyStoreBackend } from "./keystore";
import { strongholdBackend } from "./stronghold-keystore";
import { PROVIDERS } from "./providers";

/*
 * Composition root for BYOK. Picks the Stronghold-backed (encrypted, on-device)
 * key store in the Tauri app, and a non-persistent in-memory store in plain
 * browser dev (`pnpm dev`, no Tauri) so the settings page still works there —
 * keys just don't survive a reload outside the desktop app.
 */
const backend: KeyStoreBackend = isTauri() ? strongholdBackend : inMemoryBackend();

export const keyStore = createKeyStore(
  backend,
  PROVIDERS.map((p) => p.id),
);

export { PROVIDERS, getProvider } from "./providers";
export type { ProviderInfo } from "./providers";

// ---- Authoring assist (T15) ----------------------------------------------

import { getProvider } from "./providers";
import { getNoteType, listNoteTypes } from "../note-types";
import { chatClientFor, CHAT_PROVIDERS, type ChatClient } from "./chat";
import { assistFields, type AssistResult } from "./authoring-assist";
import {
  extractCandidates,
  type ExtractResult,
  type ExtractableType,
} from "./extract";
import { chooseTransport } from "./transport";
import { proxyChatClient } from "./proxy-client";
import { getWorkerUrl } from "./config";
import { subscription } from "../billing/run";

/**
 * The first chat-capable provider the user has a BYOK key for, or null. Used to
 * decide which provider to call on the BYOK path.
 */
export async function activeChatProvider(): Promise<string | null> {
  for (const id of CHAT_PROVIDERS) {
    if (await keyStore.hasKey(id)) return id;
  }
  return null;
}

/**
 * Resolve a chat client by transport (ADR-0006): the user's BYOK key wins; else
 * an active subscriber with a Worker configured uses the app-key path; else
 * null. The app-key path defaults to anthropic.
 */
export async function resolveChatClient(): Promise<ChatClient | null> {
  const byokProvider = await activeChatProvider();
  if (byokProvider) {
    const key = await keyStore.getKey(byokProvider);
    if (key) return chatClientFor(byokProvider, key);
  }
  const token = await subscription.accessToken();
  const transport = chooseTransport({
    hasByokKey: false,
    accessToken: token,
    workerUrl: getWorkerUrl(),
  });
  if (transport.kind === "app-key") {
    return proxyChatClient(transport.workerUrl, transport.token, "anthropic");
  }
  return null;
}

/** Whether any chat path (BYOK or hosted) is available, for showing AI UI. */
export async function chatAvailable(): Promise<boolean> {
  return (await resolveChatClient()) !== null;
}

export async function chatProviderLabel(): Promise<string | null> {
  const id = await activeChatProvider();
  if (id) return getProvider(id).label;
  // Hosted path available?
  return (await chatAvailable()) ? "Hosted AI" : null;
}

/**
 * Live authoring-assist runner: resolve a chat client (BYOK or hosted), build a
 * client, and fill the given Note Type's fields from a seed. Bound to the type's
 * schema and validated inside assistFields (ADR-0007). Never persists.
 */
export async function runAssist(typeId: string, seed: string): Promise<AssistResult> {
  const client = await resolveChatClient();
  if (!client) return { ok: false, error: "Add an AI key in Settings or subscribe." };
  const type = getNoteType(typeId);
  return assistFields(client, type.name, type.fields, seed);
}

/**
 * Live text-extraction runner: resolve a chat client and extract candidate Notes
 * from a document across all registered types. Each candidate is type-bound and
 * validated inside extractCandidates; nothing is created here (ADR-0007 —
 * candidates default unselected).
 */
export async function runExtract(doc: string): Promise<ExtractResult> {
  const client = await resolveChatClient();
  if (!client) return { ok: false, error: "Add an AI key in Settings or subscribe." };
  const types: ExtractableType[] = listNoteTypes().map((t) => ({
    id: t.id,
    name: t.name,
    fields: t.fields,
  }));
  return extractCandidates(client, types, doc);
}
