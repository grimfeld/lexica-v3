import type { SqlExecutor } from "../notes/repository";
import {
  makeBundle,
  serializeBundle,
  parseBundle,
  type Bundle,
} from "./bundle";

/*
 * Export reads all LIVE rows (deleted_at IS NULL) into a portable bundle.
 * Import upserts them back by primary key (import wins) — restoring a backup or
 * loading one on a new device. Tombstones are not exported: a backup is a
 * snapshot of what exists, not the deletion log.
 */

const TABLES = [
  { name: "languages", select: "SELECT * FROM languages WHERE deleted_at IS NULL" },
  { name: "notes", select: "SELECT * FROM notes WHERE deleted_at IS NULL" },
  { name: "cards", select: "SELECT * FROM cards WHERE deleted_at IS NULL" },
  { name: "decks", select: "SELECT * FROM decks WHERE deleted_at IS NULL" },
  { name: "deck_notes", select: "SELECT * FROM deck_notes WHERE deleted_at IS NULL" },
] as const;

export function createBackup(db: SqlExecutor, now: () => number) {
  async function exportBundle(): Promise<string> {
    const [languages, notes, cards, decks, deckNotes] = await Promise.all(
      TABLES.map((t) => db.select<Record<string, unknown>>(t.select)),
    );
    return serializeBundle(
      makeBundle({ languages, notes, cards, decks, deckNotes }, now()),
    );
  }

  async function importRow(table: string, row: Record<string, unknown>): Promise<void> {
    const cols = Object.keys(row);
    const placeholders = cols.map(() => "?").join(", ");
    await db.execute(
      `INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`,
      cols.map((c) => row[c]),
    );
  }

  async function importBundle(json: string): Promise<{ ok: boolean; error?: string }> {
    const parsed = parseBundle(json);
    if (!parsed.ok || !parsed.bundle) return { ok: false, error: parsed.error };
    const b: Bundle = parsed.bundle;

    const order: [string, Record<string, unknown>[]][] = [
      ["languages", b.languages],
      ["notes", b.notes],
      ["cards", b.cards],
      ["decks", b.decks],
      ["deck_notes", b.deckNotes],
    ];
    for (const [table, rows] of order) {
      for (const row of rows) await importRow(table, row);
    }
    return { ok: true };
  }

  return { exportBundle, importBundle };
}
