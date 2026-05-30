import { describe, it, expect } from "vitest";
import { createBackup } from "./backup";
import { parseBundle } from "./bundle";
import type { SqlExecutor } from "../notes/repository";

interface Call {
  query: string;
  params: unknown[];
}

function fakeDb(selectByQuery: (q: string) => unknown[]) {
  const calls: Call[] = [];
  const db: SqlExecutor = {
    execute: async (query, params = []) => {
      calls.push({ query, params });
    },
    select: async (query) => selectByQuery(query) as never,
  };
  return { db, calls };
}

describe("backup export/import", () => {
  it("exports only live rows into a valid bundle", async () => {
    const { db } = fakeDb((q) => {
      if (q.includes("FROM notes")) return [{ id: "n1", language_id: "es" }];
      if (q.includes("FROM languages")) return [{ id: "es", name: "Spanish" }];
      return [];
    });
    const backup = createBackup(db, () => 5000);
    const json = await backup.exportBundle();
    const parsed = parseBundle(json);
    expect(parsed.ok).toBe(true);
    expect(parsed.bundle?.exportedAt).toBe(5000);
    expect(parsed.bundle?.notes).toEqual([{ id: "n1", language_id: "es" }]);
  });

  it("imports rows via INSERT OR REPLACE in dependency order", async () => {
    const { db, calls } = fakeDb(() => []);
    const backup = createBackup(db, () => 0);
    const bundle = JSON.stringify({
      version: 1,
      exportedAt: 0,
      languages: [{ id: "es", name: "Spanish" }],
      notes: [{ id: "n1", language_id: "es" }],
      cards: [],
      decks: [],
      deckNotes: [],
    });
    const r = await backup.importBundle(bundle);
    expect(r.ok).toBe(true);

    const inserts = calls.filter((c) => c.query.includes("INSERT OR REPLACE"));
    // languages before notes (FK dependency order)
    const langIdx = inserts.findIndex((c) => c.query.includes("languages"));
    const noteIdx = inserts.findIndex((c) => c.query.includes("notes"));
    expect(langIdx).toBeLessThan(noteIdx);
  });

  it("rejects an invalid bundle without writing", async () => {
    const { db, calls } = fakeDb(() => []);
    const backup = createBackup(db, () => 0);
    const r = await backup.importBundle("garbage");
    expect(r.ok).toBe(false);
    expect(calls.length).toBe(0);
  });
});
