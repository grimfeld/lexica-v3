import { describe, it, expect, beforeEach } from "vitest";
import { createNotesRepository, type SqlExecutor } from "./repository";
import { registerNoteType, __resetRegistry } from "../note-types/registry";
import { vocabNoteType } from "../note-types/vocab";

interface Call {
  query: string;
  params: unknown[];
}

function fakeDb() {
  const calls: Call[] = [];
  const db: SqlExecutor = {
    execute: async (query, params = []) => {
      calls.push({ query, params });
    },
    select: async () => [],
  };
  return { db, calls };
}

const fixedNow = () => 1000;

beforeEach(() => {
  __resetRegistry();
  registerNoteType(vocabNoteType);
});

describe("notes repository", () => {
  it("createNote inserts the note and one row per derived card", async () => {
    const { db, calls } = fakeDb();
    const repo = createNotesRepository(db, fixedNow);
    await repo.createNote({
      id: "n1",
      languageId: "es",
      type: "vocab",
      fields: { term: "perro", meaning: "dog", notes: "" },
    });

    const inserts = calls.filter((c) => c.query.includes("INSERT"));
    expect(inserts.filter((c) => c.query.includes("INTO notes"))).toHaveLength(1);
    const cardInserts = inserts.filter((c) => c.query.includes("INTO cards"));
    expect(cardInserts).toHaveLength(2); // fwd + rev
    expect(cardInserts.map((c) => c.params[0])).toEqual(["n1:fwd", "n1:rev"]);
  });

  it("updateNote resets only the changed cards the caller opts to reset", async () => {
    const { db, calls } = fakeDb();
    const repo = createNotesRepository(db, fixedNow);
    const oldCards = vocabNoteType.deriveCards({ term: "perro", meaning: "dog", notes: "" });

    // meaning edited -> both fwd (answer) and rev (prompt) change.
    await repo.updateNote(
      { id: "n1", languageId: "es", type: "vocab", fields: { term: "perro", meaning: "hound", notes: "" } },
      oldCards,
      (sliceKey) => sliceKey === "fwd", // reset fwd, keep rev
    );

    const fsrsResets = calls.filter(
      (c) => c.query.includes("SET fsrs") && c.query.includes("cards"),
    );
    expect(fsrsResets).toHaveLength(1);
    expect(fsrsResets[0].params.at(-1)).toBe("n1:fwd");
  });

  it("updateNote tombstones removed cards rather than hard-deleting", async () => {
    const { db, calls } = fakeDb();
    const repo = createNotesRepository(db, fixedNow);
    const oldCards = vocabNoteType.deriveCards({ term: "perro", meaning: "dog", notes: "" });

    // meaning emptied -> deriveCards returns [] -> both cards removed.
    await repo.updateNote(
      { id: "n1", languageId: "es", type: "vocab", fields: { term: "perro", meaning: "", notes: "" } },
      oldCards,
      () => false,
    );

    const tombstones = calls.filter(
      (c) => c.query.includes("cards") && c.query.includes("deleted_at = ?"),
    );
    expect(tombstones.map((c) => c.params.at(-1)).sort()).toEqual(["n1:fwd", "n1:rev"]);
  });

  it("deleteNote tombstones the note and its cards", async () => {
    const { db, calls } = fakeDb();
    const repo = createNotesRepository(db, fixedNow);
    await repo.deleteNote("n1");
    expect(calls.some((c) => c.query.includes("notes") && c.query.includes("deleted_at"))).toBe(true);
    expect(calls.some((c) => c.query.includes("cards") && c.query.includes("deleted_at"))).toBe(true);
  });

  it("setPaused flips the paused flag and marks dirty", async () => {
    const { db, calls } = fakeDb();
    const repo = createNotesRepository(db, fixedNow);
    await repo.setPaused("n1", true);
    const c = calls[0];
    expect(c.query).toContain("SET paused");
    expect(c.query).toContain("dirty = 1");
    expect(c.params).toEqual([1, 1000, "n1"]);
  });
});
