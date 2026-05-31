import PocketBase from "pocketbase";
import type { RemoteStore, SyncRow } from "./engine";

/*
 * PocketBase adapter (ADR-0006/0010): the shared server copy behind the
 * RemoteStore interface, plus thin auth. Optional — local users never construct
 * this. The base URL is configured by the user in settings (Cloud Storage Mode);
 * the SDK persists the auth session itself (pb.authStore).
 *
 * Records map 1:1 to local rows. PocketBase reserves its own `id`; we store our
 * stable app id in a `rid` field and round-trip the row payload in `data`, so
 * the LWW metadata (updatedAt/deletedAt) and the opaque columns survive intact.
 */

export interface RemoteRecord {
  rid: string;
  updated_at: number;
  deleted_at: number | null;
  data: string; // JSON of the full local row
}

export function createPocketBase(baseUrl: string) {
  return new PocketBase(baseUrl);
}

export function pocketbaseRemoteStore(pb: PocketBase): RemoteStore {
  return {
    async pull(collection, since) {
      const list = await pb.collection(collection).getFullList<RemoteRecord>({
        filter: since > 0 ? `updated_at >= ${since}` : "",
      });
      return list.map((r) => JSON.parse(r.data) as SyncRow);
    },

    async push(collection, rows) {
      for (const row of rows) {
        const record: RemoteRecord = {
          rid: row.id,
          updated_at: row.updatedAt,
          deleted_at: row.deletedAt,
          data: JSON.stringify(row),
        };
        // Upsert by our stable id: try update, fall back to create.
        const existing = await pb
          .collection(collection)
          .getFirstListItem<{ id: string }>(`rid = "${row.id}"`)
          .catch(() => null);
        if (existing) await pb.collection(collection).update(existing.id, record);
        else await pb.collection(collection).create(record);
      }
    },
  };
}

// ---- Auth (optional; local users skip) -------------------------------------

export interface AuthApi {
  signUp(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): void;
  isSignedIn(): boolean;
  email(): string | null;
}

export function pocketbaseAuth(pb: PocketBase): AuthApi {
  return {
    async signUp(email, password) {
      await pb
        .collection("users")
        .create({ email, password, passwordConfirm: password });
      await pb.collection("users").authWithPassword(email, password);
    },
    async signIn(email, password) {
      await pb.collection("users").authWithPassword(email, password);
    },
    signOut() {
      pb.authStore.clear();
    },
    isSignedIn() {
      return pb.authStore.isValid;
    },
    email() {
      const rec = pb.authStore.record as { email?: string } | null;
      return rec?.email ?? null;
    },
  };
}
