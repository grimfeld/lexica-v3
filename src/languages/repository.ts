import type { SqlExecutor } from "../notes/repository";

/*
 * Persistence for Languages — the top-level partition (CONTEXT.md). Every Note,
 * Deck, session and stat belongs to exactly one Language. The native/meaning
 * side of a Note is untracked free text, so a Language is just the target
 * language (plus an optional per-Language content font, set later).
 */

export interface LanguageRow {
  id: string;
  name: string;
  content_font: string | null;
}

export interface LanguageInput {
  id: string;
  name: string;
  contentFont?: string | null;
}

export function createLanguagesRepository(db: SqlExecutor, now: () => number) {
  async function createLanguage(input: LanguageInput): Promise<void> {
    await db.execute(
      `INSERT INTO languages (id, name, content_font, updated_at, dirty)
       VALUES (?, ?, ?, ?, 1)`,
      [input.id, input.name, input.contentFont ?? null, now()],
    );
  }

  async function renameLanguage(id: string, name: string): Promise<void> {
    await db.execute(
      `UPDATE languages SET name = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [name, now(), id],
    );
  }

  async function setContentFont(id: string, font: string | null): Promise<void> {
    await db.execute(
      `UPDATE languages SET content_font = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [font, now(), id],
    );
  }

  async function deleteLanguage(id: string): Promise<void> {
    const ts = now();
    // Tombstone the Language and all its owned rows (ADR-0010).
    await db.execute(
      `UPDATE languages SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?`,
      [ts, ts, id],
    );
    for (const table of ["notes", "decks"]) {
      await db.execute(
        `UPDATE ${table} SET deleted_at = ?, updated_at = ?, dirty = 1
         WHERE language_id = ? AND deleted_at IS NULL`,
        [ts, ts, id],
      );
    }
  }

  async function listLanguages(): Promise<LanguageRow[]> {
    return db.select<LanguageRow>(
      `SELECT id, name, content_font FROM languages
       WHERE deleted_at IS NULL ORDER BY name`,
    );
  }

  return { createLanguage, renameLanguage, setContentFont, deleteLanguage, listLanguages };
}
