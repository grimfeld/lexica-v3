import { getDb } from "../db/client";
import type { SqlExecutor } from "./repository";

/** The production SqlExecutor — wraps the Tauri SQL plugin connection. */
export const tauriExecutor: SqlExecutor = {
  async execute(query, params = []) {
    const db = await getDb();
    await db.execute(query, params as unknown[]);
  },
  async select<T>(query: string, params: unknown[] = []) {
    const db = await getDb();
    return db.select<T[]>(query, params as unknown[]);
  },
};
