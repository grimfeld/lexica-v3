import { reconcile, type SyncRecord } from "./reconcile";

/*
 * Sync orchestration over the LWW reconciler (ADR-0010). One pass per table:
 * pull the remote's records, reconcile against local, then apply pulls locally
 * and push the records local won. The remote and local stores are injected
 * behind narrow interfaces so the engine unit-tests without PocketBase or
 * SQLite — the reconciler holds the policy, this holds the data flow.
 *
 * A synced row is a flat record carrying at least the SyncRecord fields plus its
 * payload columns. We treat it opaquely except for the sync metadata.
 */

export type SyncRow = SyncRecord & Record<string, unknown>;

/** The shared server copy (PocketBase) for one collection. */
export interface RemoteStore {
  /** All records changed at-or-after `since` (0 = full pull). */
  pull(collection: string, since: number): Promise<SyncRow[]>;
  /** Upsert the given records (create or replace by id), tombstones included. */
  push(collection: string, rows: SyncRow[]): Promise<void>;
}

/** The local SQLite side for one table. */
export interface LocalStore {
  /** All local records (live + tombstoned) for reconciliation. */
  all(table: string): Promise<SyncRow[]>;
  /** Upsert remote-won records locally (by id), tombstones included. */
  apply(table: string, rows: SyncRow[]): Promise<void>;
  /** Clear the dirty flag on records that have been pushed. */
  clearDirty(table: string, ids: string[]): Promise<void>;
}

/** A table to sync and whether it uses the last-review-wins policy. */
export interface SyncedTable {
  /** Local SQLite table name. */
  table: string;
  /** Remote PocketBase collection name. */
  collection: string;
  /** Cards use last-review-wins; content tables use plain LWW. */
  useReview?: boolean;
}

export interface TableSyncResult {
  table: string;
  pushed: number;
  pulled: number;
}

/**
 * Sync one table: reconcile full local vs. remote(since watermark) record sets,
 * apply remote-won rows locally, push local-won rows, then clear their dirty
 * flags. Returns counts for reporting.
 */
export async function syncTable(
  t: SyncedTable,
  since: number,
  remote: RemoteStore,
  local: LocalStore,
): Promise<TableSyncResult> {
  const [localRows, remoteRows] = await Promise.all([
    local.all(t.table),
    remote.pull(t.collection, since),
  ]);

  const plan = reconcile(localRows, remoteRows, t.useReview ?? false);

  const localById = new Map(localRows.map((r) => [r.id, r]));
  const remoteById = new Map(remoteRows.map((r) => [r.id, r]));

  // Apply the rows the remote won (present remotely) locally.
  const toApply = plan.pull.map((id) => remoteById.get(id)).filter((r): r is SyncRow => !!r);
  if (toApply.length) await local.apply(t.table, toApply);

  // Push the rows the local won (present locally).
  const toPush = plan.push.map((id) => localById.get(id)).filter((r): r is SyncRow => !!r);
  if (toPush.length) {
    await remote.push(t.collection, toPush);
    await local.clearDirty(t.table, toPush.map((r) => r.id));
  }

  return { table: t.table, pushed: toPush.length, pulled: toApply.length };
}

/** Run a full sync across all tables in dependency order. */
export async function syncAll(
  tables: SyncedTable[],
  since: number,
  remote: RemoteStore,
  local: LocalStore,
): Promise<TableSyncResult[]> {
  const results: TableSyncResult[] = [];
  // Sequential: FK dependency order (languages before notes before cards…).
  for (const t of tables) {
    results.push(await syncTable(t, since, remote, local));
  }
  return results;
}
