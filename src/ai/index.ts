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
import { getNoteType } from "../note-types";
import { chatClientFor, CHAT_PROVIDERS } from "./chat";
import { assistFields, type AssistResult } from "./authoring-assist";

/**
 * The first chat-capable provider the user has a key for, or null. Used to
 * decide whether to show the assist panel and which provider to call.
 */
export async function activeChatProvider(): Promise<string | null> {
  for (const id of CHAT_PROVIDERS) {
    if (await keyStore.hasKey(id)) return id;
  }
  return null;
}

export async function chatProviderLabel(): Promise<string | null> {
  const id = await activeChatProvider();
  return id ? getProvider(id).label : null;
}

/**
 * Live authoring-assist runner: resolve the active chat provider's key, build a
 * client, and fill the given Note Type's fields from a seed. Bound to the type's
 * schema and validated inside assistFields (ADR-0007). Never persists.
 */
export async function runAssist(typeId: string, seed: string): Promise<AssistResult> {
  const providerId = await activeChatProvider();
  if (!providerId) return { ok: false, error: "Add an AI key in Settings first." };
  const key = await keyStore.getKey(providerId);
  if (!key) return { ok: false, error: "Add an AI key in Settings first." };
  const client = chatClientFor(providerId, key);
  if (!client) return { ok: false, error: "This provider can't draft fields." };
  const type = getNoteType(typeId);
  return assistFields(client, type.name, type.fields, seed);
}
