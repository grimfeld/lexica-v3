import PocketBase from "pocketbase";
import { tauriExecutor } from "../notes/executor";
import { syncAll, type SyncedTable, type TableSyncResult } from "./engine";
import { createLocalStore, createSyncStateRepo } from "./local-store";
import {
  createPocketBase,
  pocketbaseRemoteStore,
  pocketbaseAuth,
  type AuthApi,
} from "./pocketbase";

/*
 * Live sync wiring (ADR-0010). Cloud Storage Mode is opt-in; a local-only user
 * never reaches here. The PocketBase base URL is configured by the user; auth is
 * optional sign in/up. A full sync reconciles every synced table against the
 * server using the LWW engine, then advances the device watermark.
 */

// Synced in FK dependency order. tts_cache and sync_state are device-local and
// deliberately excluded (ADR-0008/0010).
const SYNCED_TABLES: SyncedTable[] = [
  { table: "languages", collection: "languages" },
  { table: "notes", collection: "notes" },
  { table: "cards", collection: "cards", useReview: true },
  { table: "decks", collection: "decks" },
  { table: "deck_notes", collection: "deck_notes" },
  { table: "pronunciations", collection: "pronunciations" },
];

const localStore = createLocalStore(tauriExecutor);
const syncState = createSyncStateRepo(tauriExecutor);

let pb: PocketBase | null = null;
let configuredUrl: string | null = null;

/** Configure (or reconfigure) the PocketBase endpoint for Cloud Storage Mode. */
export function configureCloud(baseUrl: string): void {
  configuredUrl = baseUrl;
  pb = createPocketBase(baseUrl);
}

export function cloudConfigured(): boolean {
  return pb !== null;
}

/** The shared PocketBase instance (or null) — for billing/run to read the user. */
export function pbInstance(): PocketBase | null {
  return pb;
}

export function currentUrl(): string | null {
  return configuredUrl;
}

export function signedInEmail(): string | null {
  return pb ? pocketbaseAuth(pb).email() : null;
}

export function auth(): AuthApi | null {
  return pb ? pocketbaseAuth(pb) : null;
}

export interface SyncOutcome {
  ok: boolean;
  error?: string;
  results?: TableSyncResult[];
}

/**
 * Run one full sync pass. Requires cloud to be configured and signed in. The
 * watermark is read before the pull and advanced to the start time after a
 * clean pass, so a record changed mid-sync is caught next time (not skipped).
 */
export async function syncNow(now: () => number = () => Date.now()): Promise<SyncOutcome> {
  if (!pb) return { ok: false, error: "Cloud isn't configured." };
  if (!pb.authStore.isValid) return { ok: false, error: "Sign in to sync." };

  const startedAt = now();
  try {
    const since = await syncState.getWatermark();
    const remote = pocketbaseRemoteStore(pb);
    const results = await syncAll(SYNCED_TABLES, since, remote, localStore);
    await syncState.setWatermark(startedAt);
    return { ok: true, results };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sync failed." };
  }
}
