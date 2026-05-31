import { Stronghold, Client } from "@tauri-apps/plugin-stronghold";
import { appDataDir } from "@tauri-apps/api/path";
import type { KeyStoreBackend } from "./keystore";

/*
 * The live KeyStoreBackend: BYOK keys persisted in an OS-encrypted Stronghold
 * vault. Deliberately separate from the SQLite DB so a key never enters the
 * synced tables (ADR-0010) or the backup bundle. The Rust side derives the
 * vault password via argon2 from a device salt; here we open it with a fixed
 * app passphrase — the encryption at rest is the salt + OS, not this string.
 *
 * Lazily initialised; all access funnels through one loaded client + store.
 */

const VAULT_FILE = "byok.stronghold";
const CLIENT_NAME = "lexica-byok";
// Fixed app passphrase. Not the security boundary (the argon2 salt + on-disk
// encryption is); it only namespaces this vault.
const VAULT_PASS = "lexica-byok-vault";

let cached: Promise<{ hold: Stronghold; client: Client }> | null = null;

async function init() {
  if (!cached) {
    cached = (async () => {
      const dir = await appDataDir();
      const path = `${dir}/${VAULT_FILE}`;
      const hold = await Stronghold.load(path, VAULT_PASS);
      let client: Client;
      try {
        client = await hold.loadClient(CLIENT_NAME);
      } catch {
        client = await hold.createClient(CLIENT_NAME);
      }
      return { hold, client };
    })();
  }
  return cached;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export const strongholdBackend: KeyStoreBackend = {
  async get(providerId) {
    const { client } = await init();
    const store = client.getStore();
    const bytes = await store.get(providerId);
    if (!bytes || bytes.length === 0) return null;
    return dec.decode(new Uint8Array(bytes));
  },
  async set(providerId, key) {
    const { hold, client } = await init();
    const store = client.getStore();
    await store.insert(providerId, Array.from(enc.encode(key)));
    await hold.save();
  },
  async remove(providerId) {
    const { hold, client } = await init();
    const store = client.getStore();
    await store.remove(providerId);
    await hold.save();
  },
};
