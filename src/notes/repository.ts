import type { DerivedCard, FieldValues } from "../note-types/contract";
import { getNoteType } from "../note-types/registry";
import { diffCards } from "./card-diff";
import { newCardState, grade, serializeState, deserializeState } from "../scheduling/engine";

/*
 * Persistence for Notes and their derived Cards. The DB executor is injected so
 * this is testable without Tauri (the real executor wraps the Tauri SQL plugin;
 * see ./executor). Sync columns (updated_at, dirty, deleted_at) per ADR-0010
 * are set on every write.
 */

export interface SqlExecutor {
  execute(query: string, params?: unknown[]): Promise<void>;
  select<T>(query: string, params?: unknown[]): Promise<T[]>;
}

export interface NoteInput {
  id: string;
  languageId: string;
  type: string;
  fields: FieldValues;
}

interface CardRow {
  id: string;
  slice_key: string;
}

/** Caller decides, per changed card, whether to reset its FSRS state (ADR-0009). */
export type ResetDecision = (sliceKey: string) => boolean;

interface FsrsRow {
  id: string;
  fsrs: string;
}

export function createNotesRepository(db: SqlExecutor, now: () => number) {
  const freshFsrs = () => serializeState(newCardState(new Date(now())));
  async function insertCard(noteId: string, card: DerivedCard): Promise<void> {
    await db.execute(
      `INSERT INTO cards (id, note_id, slice_key, fsrs, updated_at, dirty)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [`${noteId}:${card.sliceKey}`, noteId, card.sliceKey, freshFsrs(), now()],
    );
  }

  async function createNote(input: NoteInput): Promise<void> {
    const type = getNoteType(input.type);
    const ts = now();
    await db.execute(
      `INSERT INTO notes (id, language_id, type, fields, paused, updated_at, dirty)
       VALUES (?, ?, ?, ?, 0, ?, 1)`,
      [input.id, input.languageId, input.type, JSON.stringify(input.fields), ts],
    );
    for (const card of type.deriveCards(input.fields)) {
      await insertCard(input.id, card);
    }
  }

  /**
   * Re-derive on edit (ADR-0009). Existing Cards diff against the new
   * derivation; `reset` is consulted only for content-changed Cards.
   */
  async function updateNote(
    input: NoteInput,
    oldCards: DerivedCard[],
    reset: ResetDecision,
  ): Promise<void> {
    const type = getNoteType(input.type);
    const ts = now();
    const newCards = type.deriveCards(input.fields);
    const plan = diffCards(oldCards, newCards);

    await db.execute(
      `UPDATE notes SET fields = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [JSON.stringify(input.fields), ts, input.id],
    );

    for (const card of plan.insert) await insertCard(input.id, card);

    for (const sliceKey of plan.remove) {
      // Tombstone, not hard delete (ADR-0010).
      await db.execute(
        `UPDATE cards SET deleted_at = ?, updated_at = ?, dirty = 1
         WHERE id = ?`,
        [ts, ts, `${input.id}:${sliceKey}`],
      );
    }

    for (const { sliceKey } of plan.changed) {
      if (reset(sliceKey)) {
        await db.execute(
          `UPDATE cards SET fsrs = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
          [freshFsrs(), ts, `${input.id}:${sliceKey}`],
        );
      } else {
        // Keep FSRS state; just mark dirty for sync.
        await db.execute(
          `UPDATE cards SET updated_at = ?, dirty = 1 WHERE id = ?`,
          [ts, `${input.id}:${sliceKey}`],
        );
      }
    }
  }

  async function setPaused(noteId: string, paused: boolean): Promise<void> {
    await db.execute(
      `UPDATE notes SET paused = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [paused ? 1 : 0, now(), noteId],
    );
  }

  async function deleteNote(noteId: string): Promise<void> {
    const ts = now();
    // Tombstone the Note and all its Cards (ADR-0010).
    await db.execute(
      `UPDATE notes SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [ts, ts, noteId],
    );
    await db.execute(
      `UPDATE cards SET deleted_at = ?, updated_at = ?, dirty = 1
       WHERE note_id = ? AND deleted_at IS NULL`,
      [ts, ts, noteId],
    );
  }

  async function liveCardSlices(noteId: string): Promise<string[]> {
    const rows = await db.select<CardRow>(
      `SELECT id, slice_key FROM cards WHERE note_id = ? AND deleted_at IS NULL`,
      [noteId],
    );
    return rows.map((r) => r.slice_key);
  }

  /** Apply a binary grade to a Card and persist its new FSRS state. */
  async function gradeCard(cardId: string, pass: boolean): Promise<void> {
    const rows = await db.select<FsrsRow>(
      `SELECT id, fsrs FROM cards WHERE id = ? AND deleted_at IS NULL`,
      [cardId],
    );
    if (rows.length === 0) throw new Error(`Card not found: ${cardId}`);
    const ts = now();
    const next = grade(deserializeState(rows[0].fsrs), pass, new Date(ts));
    await db.execute(
      `UPDATE cards SET fsrs = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [serializeState(next), ts, cardId],
    );
  }

  return { createNote, updateNote, setPaused, deleteNote, liveCardSlices, gradeCard };
}
