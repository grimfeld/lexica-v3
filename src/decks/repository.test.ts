import { describe, it, expect } from "vitest";
import { createDecksRepository } from "./repository";
import type { SqlExecutor } from "../notes/repository";

interface Call {
  query: string;
  params: unknown[];
}

function fakeDb(selectRows: unknown[] = []) {
  const calls: Call[] = [];
  const db: SqlExecutor = {
    execute: async (query, params = []) => {
      calls.push({ query, params });
    },
    select: async () => selectRows as never,
  };
  return { db, calls };
}

const now = () => 1000;

describe("decks repository", () => {
  it("createDeck inserts with sync columns", async () => {
    const { db, calls } = fakeDb();
    const repo = createDecksRepository(db, now);
    await repo.createDeck({ id: "d1", languageId: "es", name: "Travel" });
    expect(calls[0].query).toContain("INSERT INTO decks");
    expect(calls[0].params).toEqual(["d1", "es", "Travel", 1000]);
  });

  it("deleteDeck tombstones the deck and its memberships", async () => {
    const { db, calls } = fakeDb();
    const repo = createDecksRepository(db, now);
    await repo.deleteDeck("d1");
    expect(calls.some((c) => c.query.includes("decks") && c.query.includes("deleted_at"))).toBe(true);
    expect(calls.some((c) => c.query.includes("deck_notes") && c.query.includes("deleted_at"))).toBe(true);
  });

  it("addNote is idempotent — skips when a live membership exists", async () => {
    const { db, calls } = fakeDb([{ deck_id: "d1" }]); // membership already present
    const repo = createDecksRepository(db, now);
    await repo.addNote("d1", "n1");
    expect(calls.some((c) => c.query.includes("INSERT INTO deck_notes"))).toBe(false);
  });

  it("addNote inserts when no live membership exists", async () => {
    const { db, calls } = fakeDb([]); // none present
    const repo = createDecksRepository(db, now);
    await repo.addNote("d1", "n1");
    expect(calls.some((c) => c.query.includes("INSERT INTO deck_notes"))).toBe(true);
  });

  it("removeNote tombstones the membership (multi-membership preserved elsewhere)", async () => {
    const { db, calls } = fakeDb();
    const repo = createDecksRepository(db, now);
    await repo.removeNote("d1", "n1");
    expect(calls[0].query).toContain("deck_notes");
    expect(calls[0].query).toContain("deleted_at");
    expect(calls[0].params).toEqual([1000, 1000, "d1", "n1"]);
  });
});
