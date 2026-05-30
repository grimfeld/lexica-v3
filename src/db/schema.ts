import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/*
 * Sync-ready columns (ADR-0010): every synced row carries `updatedAt` and a
 * `dirty` flag; deletes are tombstones (`deletedAt`) so "gone locally" is not
 * confused with "never synced". The hand-rolled LWW reconciler keys off these.
 */
const syncColumns = {
  updatedAt: integer("updated_at").notNull(),
  dirty: integer("dirty", { mode: "boolean" }).notNull().default(true),
  deletedAt: integer("deleted_at"),
};

/** A target language the user studies — the top-level partition (CONTEXT.md). */
export const languages = sqliteTable("languages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Per-Language content font and TTS voice live here later (ADR-0008).
  contentFont: text("content_font"),
  ...syncColumns,
});

/** The rich, user-authored unit. `type` names a code-defined Note Type module. */
export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    languageId: text("language_id").notNull(),
    type: text("type").notNull(),
    // Type-specific authored fields, serialized; shape owned by the Note Type.
    fields: text("fields", { mode: "json" }).notNull(),
    paused: integer("paused", { mode: "boolean" }).notNull().default(false),
    ...syncColumns,
  },
  (t) => [index("notes_language_idx").on(t.languageId)],
);

/** A review prompt derived from a Note; holds FSRS state (ADR-0004/0009). */
export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id").notNull(),
    // Stable slice identity within the Note (ADR-0009), e.g. "présent/je".
    sliceKey: text("slice_key").notNull(),
    // Serialized ts-fsrs card state (due, stability, difficulty, reps, ...).
    fsrs: text("fsrs", { mode: "json" }).notNull(),
    ...syncColumns,
  },
  (t) => [index("cards_note_idx").on(t.noteId)],
);

/** User-created grouping of Notes; many-to-many (CONTEXT.md). */
export const decks = sqliteTable("decks", {
  id: text("id").primaryKey(),
  languageId: text("language_id").notNull(),
  name: text("name").notNull(),
  ...syncColumns,
});

export const deckNotes = sqliteTable(
  "deck_notes",
  {
    deckId: text("deck_id").notNull(),
    noteId: text("note_id").notNull(),
    ...syncColumns,
  },
  (t) => [index("deck_notes_deck_idx").on(t.deckId)],
);
