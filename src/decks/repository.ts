import type { SqlExecutor } from "../notes/repository";

/*
 * Persistence for Decks (CONTEXT.md): user-created groupings of Notes,
 * many-to-many via deck_notes. The app never auto-files — membership is always
 * an explicit user action. Sync columns + tombstones per ADR-0010.
 */

export interface DeckRow {
  id: string;
  language_id: string;
  name: string;
}

export interface DeckInput {
  id: string;
  languageId: string;
  name: string;
}

export function createDecksRepository(db: SqlExecutor, now: () => number) {
  async function createDeck(input: DeckInput): Promise<void> {
    await db.execute(
      `INSERT INTO decks (id, language_id, name, updated_at, dirty)
       VALUES (?, ?, ?, ?, 1)`,
      [input.id, input.languageId, input.name, now()],
    );
  }

  async function renameDeck(deckId: string, name: string): Promise<void> {
    await db.execute(
      `UPDATE decks SET name = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [name, now(), deckId],
    );
  }

  async function deleteDeck(deckId: string): Promise<void> {
    const ts = now();
    await db.execute(
      `UPDATE decks SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [ts, ts, deckId],
    );
    // Tombstone the memberships too.
    await db.execute(
      `UPDATE deck_notes SET deleted_at = ?, updated_at = ?, dirty = 1
       WHERE deck_id = ? AND deleted_at IS NULL`,
      [ts, ts, deckId],
    );
  }

  /** Add a Note to a Deck. Idempotent: re-adding a live membership is a no-op. */
  async function addNote(deckId: string, noteId: string): Promise<void> {
    const ts = now();
    const existing = await db.select<{ deck_id: string }>(
      `SELECT deck_id FROM deck_notes
       WHERE deck_id = ? AND note_id = ? AND deleted_at IS NULL`,
      [deckId, noteId],
    );
    if (existing.length > 0) return;
    await db.execute(
      `INSERT INTO deck_notes (deck_id, note_id, updated_at, dirty)
       VALUES (?, ?, ?, 1)`,
      [deckId, noteId, ts],
    );
  }

  async function removeNote(deckId: string, noteId: string): Promise<void> {
    const ts = now();
    await db.execute(
      `UPDATE deck_notes SET deleted_at = ?, updated_at = ?, dirty = 1
       WHERE deck_id = ? AND note_id = ? AND deleted_at IS NULL`,
      [ts, ts, deckId, noteId],
    );
  }

  async function listDecks(languageId: string): Promise<DeckRow[]> {
    return db.select<DeckRow>(
      `SELECT id, language_id, name FROM decks
       WHERE language_id = ? AND deleted_at IS NULL ORDER BY name`,
      [languageId],
    );
  }

  async function noteIdsInDeck(deckId: string): Promise<string[]> {
    const rows = await db.select<{ note_id: string }>(
      `SELECT note_id FROM deck_notes
       WHERE deck_id = ? AND deleted_at IS NULL`,
      [deckId],
    );
    return rows.map((r) => r.note_id);
  }

  async function deckIdsForNote(noteId: string): Promise<string[]> {
    const rows = await db.select<{ deck_id: string }>(
      `SELECT deck_id FROM deck_notes
       WHERE note_id = ? AND deleted_at IS NULL`,
      [noteId],
    );
    return rows.map((r) => r.deck_id);
  }

  return {
    createDeck,
    renameDeck,
    deleteDeck,
    addNote,
    removeNote,
    listDecks,
    noteIdsInDeck,
    deckIdsForNote,
  };
}
