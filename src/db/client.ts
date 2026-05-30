import Database from "@tauri-apps/plugin-sql";

/*
 * Single connection to the on-device SQLite DB. Migrations are applied on the
 * Rust side at startup (see src-tauri/src/lib.rs); this just opens the same DB
 * for queries. The hand-rolled LWW sync layer (ADR-0010) and the Drizzle-typed
 * repositories will sit on top of this.
 */
const DB_URL = "sqlite:lexica.db";

let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_URL);
  }
  return dbPromise;
}
