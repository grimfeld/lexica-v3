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
