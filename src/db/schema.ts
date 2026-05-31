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

/**
 * App-generated Pronunciation (ADR-0002): IPA for a Note's IPA-bearing field,
 * keyed by (noteId, fieldKey). Display-only, never tested, NULLABLE — note
 * creation never blocks on it; a background job backfills it (ADR-0002 / T17).
 * `status` drives the retry queue: pending = not yet attempted, done = filled
 * (ipa may still be null if genuinely unavailable), failed = last attempt errored.
 */
export const pronunciations = sqliteTable(
  "pronunciations",
  {
    // Composite identity flattened into a single key: `${noteId}:${fieldKey}`.
    id: text("id").primaryKey(),
    noteId: text("note_id").notNull(),
    fieldKey: text("field_key").notNull(),
    // The source text the IPA was generated for — lets us detect staleness on edit.
    sourceText: text("source_text").notNull(),
    ipa: text("ipa"),
    status: text("status").notNull().default("pending"),
    ...syncColumns,
  },
  (t) => [index("pronunciations_note_idx").on(t.noteId)],
);

/**
 * Local TTS audio cache (ADR-0008). Keyed by hash(normalizedText + language) —
 * voice/model are app-fixed per Language, so they don't enter the key. This is a
 * device-local artifact, NOT synced data, so it deliberately carries no sync
 * columns: the shared/global cache is a separate PocketBase store (T22). Audio
 * is stored base64-encoded with its mime type.
 */
export const ttsCache = sqliteTable("tts_cache", {
  keyhash: text("keyhash").primaryKey(),
  audioB64: text("audio_b64").notNull(),
  mime: text("mime").notNull(),
  createdAt: integer("created_at").notNull(),
});
