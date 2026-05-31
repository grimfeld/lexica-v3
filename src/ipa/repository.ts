import type { SqlExecutor } from "../notes/repository";

/*
 * Persistence for app-generated Pronunciation (ADR-0002). One row per
 * (noteId, fieldKey). Rows are enqueued (status='pending') when a Note's
 * IPA-bearing fields are authored/edited, then drained by the backfill job.
 * Sync columns are set on every write (ADR-0010). Executor is injected so this
 * unit-tests without Tauri.
 */

export type IpaStatus = "pending" | "done" | "failed";

export interface PronRow {
  id: string;
  noteId: string;
  fieldKey: string;
  sourceText: string;
  ipa: string | null;
  status: IpaStatus;
}

/** One IPA-bearing field's current authored value, for enqueue. */
export interface IpaFieldValue {
  fieldKey: string;
  text: string;
}

const pid = (noteId: string, fieldKey: string) => `${noteId}:${fieldKey}`;

export function createPronunciationsRepository(db: SqlExecutor, now: () => number) {
  /**
   * Ensure a pending row exists for each given field. A row is (re)set to
   * pending only when it's new or its source text changed (stale) — an unchanged
   * field keeps its existing IPA and status, so we don't re-generate needlessly.
   * Fields no longer IPA-bearing or now empty are tombstoned.
   */
  async function enqueueForNote(
    noteId: string,
    fields: IpaFieldValue[],
  ): Promise<void> {
    const ts = now();
    const existing = await db.select<PronRow>(
      `SELECT id, note_id AS noteId, field_key AS fieldKey, source_text AS sourceText,
              ipa, status FROM pronunciations
       WHERE note_id = ? AND deleted_at IS NULL`,
      [noteId],
    );
    const byKey = new Map(existing.map((r) => [r.fieldKey, r]));
    const wanted = new Set(fields.filter((f) => f.text.trim() !== "").map((f) => f.fieldKey));

    for (const f of fields) {
      if (f.text.trim() === "") continue;
      const prev = byKey.get(f.fieldKey);
      if (!prev) {
        await db.execute(
          `INSERT INTO pronunciations
             (id, note_id, field_key, source_text, ipa, status, updated_at, dirty)
           VALUES (?, ?, ?, ?, NULL, 'pending', ?, 1)`,
          [pid(noteId, f.fieldKey), noteId, f.fieldKey, f.text, ts],
        );
      } else if (prev.sourceText !== f.text) {
        // Source changed -> stale; re-queue.
        await db.execute(
          `UPDATE pronunciations
             SET source_text = ?, ipa = NULL, status = 'pending', updated_at = ?, dirty = 1
           WHERE id = ?`,
          [f.text, ts, prev.id],
        );
      }
    }

    // Tombstone rows whose field is no longer present/IPA-bearing.
    for (const r of existing) {
      if (!wanted.has(r.fieldKey)) {
        await db.execute(
          `UPDATE pronunciations SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
          [ts, ts, r.id],
        );
      }
    }
  }

  /** Up to `limit` rows awaiting work (pending, or failed for retry). */
  async function listQueued(limit: number): Promise<PronRow[]> {
    return db.select<PronRow>(
      `SELECT id, note_id AS noteId, field_key AS fieldKey, source_text AS sourceText,
              ipa, status FROM pronunciations
       WHERE status IN ('pending','failed') AND deleted_at IS NULL
       ORDER BY updated_at ASC LIMIT ?`,
      [limit],
    );
  }

  /** Record a resolved IPA (or a failure to retry later). */
  async function resolve(id: string, ipa: string | null, failed: boolean): Promise<void> {
    const ts = now();
    const status: IpaStatus = failed ? "failed" : "done";
    await db.execute(
      `UPDATE pronunciations SET ipa = ?, status = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [ipa, status, ts, id],
    );
  }

  /** IPA for a note's fields, for the review renderer (display-only). */
  async function getForNote(noteId: string): Promise<Record<string, string | null>> {
    const rows = await db.select<{ fieldKey: string; ipa: string | null }>(
      `SELECT field_key AS fieldKey, ipa FROM pronunciations
       WHERE note_id = ? AND deleted_at IS NULL`,
      [noteId],
    );
    const out: Record<string, string | null> = {};
    for (const r of rows) out[r.fieldKey] = r.ipa;
    return out;
  }

  return { enqueueForNote, listQueued, resolve, getForNote };
}

export type PronunciationsRepository = ReturnType<typeof createPronunciationsRepository>;
