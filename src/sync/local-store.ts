import type { SqlExecutor } from "../notes/repository";
import type { LocalStore, SyncRow } from "./engine";

/*
 * The live LocalStore (ADR-0010): reads/writes the SQLite tables for sync. Rows
 * are read with SELECT * and normalized so the engine sees `updatedAt`,
 * `deletedAt`, and (for cards) `lastReviewAt` regardless of the snake_case DB
 * columns. apply() upserts remote-won rows verbatim (INSERT OR REPLACE),
 * tombstones included; clearDirty() flips the pushed rows' dirty flag.
 *
 * Cards expose their FSRS last_review time as `lastReviewAt` so the engine can
 * apply the last-review-wins policy without parsing FSRS elsewhere.
 */

interface RawRow {
  id: string;
  updated_at: number;
  deleted_at: number | null;
  [k: string]: unknown;
}

function lastReviewOf(row: RawRow): number | null {
  const fsrs = row.fsrs;
  if (typeof fsrs !== "string") return null;
  try {
    const parsed = JSON.parse(fsrs) as { last_review?: string | null };
    return parsed.last_review ? new Date(parsed.last_review).getTime() : null;
  } catch {
    return null;
  }
}

function toSyncRow(row: RawRow): SyncRow {
  return {
    ...row,
    id: row.id,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
    lastReviewAt: lastReviewOf(row),
  };
}

/** Strip the engine's normalized aliases before writing raw rows back to SQLite. */
function toRawColumns(row: SyncRow): Record<string, unknown> {
  const { updatedAt, deletedAt, lastReviewAt, ...rest } = row;
  void updatedAt;
  void deletedAt;
  void lastReviewAt;
  return rest;
}

export function createLocalStore(db: SqlExecutor): LocalStore {
  return {
    async all(table) {
      const rows = await db.select<RawRow>(`SELECT * FROM ${table}`);
      return rows.map(toSyncRow);
    },

    async apply(table, rows) {
      for (const row of rows) {
        const raw = toRawColumns(row);
        const cols = Object.keys(raw);
        const placeholders = cols.map(() => "?").join(", ");
        await db.execute(
          `INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`,
          cols.map((c) => raw[c]),
        );
      }
    },

    async clearDirty(table, ids) {
      if (ids.length === 0) return;
      const placeholders = ids.map(() => "?").join(", ");
      await db.execute(
        `UPDATE ${table} SET dirty = 0 WHERE id IN (${placeholders})`,
        ids,
      );
    },
  };
}

// ---- Watermark --------------------------------------------------------------

const WATERMARK_KEY = "last_synced_at";

export function createSyncStateRepo(db: SqlExecutor) {
  async function getWatermark(): Promise<number> {
    const rows = await db.select<{ value: string }>(
      `SELECT value FROM sync_state WHERE key = ?`,
      [WATERMARK_KEY],
    );
    return rows[0] ? Number(rows[0].value) : 0;
  }

  async function setWatermark(ts: number): Promise<void> {
    await db.execute(
      `INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)`,
      [WATERMARK_KEY, String(ts)],
    );
  }

  return { getWatermark, setWatermark };
}
