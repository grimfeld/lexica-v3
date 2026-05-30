import { describe, it, expect } from "vitest";
import { createLanguagesRepository } from "./repository";
import type { SqlExecutor } from "../notes/repository";

interface Call {
  query: string;
  params: unknown[];
}

function fakeDb(rows: unknown[] = []) {
  const calls: Call[] = [];
  const db: SqlExecutor = {
    execute: async (query, params = []) => {
      calls.push({ query, params });
    },
    select: async () => rows as never,
  };
  return { db, calls };
}

const now = () => 1000;

describe("languages repository", () => {
  it("createLanguage inserts with sync columns", async () => {
    const { db, calls } = fakeDb();
    const repo = createLanguagesRepository(db, now);
    await repo.createLanguage({ id: "es", name: "Spanish" });
    expect(calls[0].query).toContain("INSERT INTO languages");
    expect(calls[0].params).toEqual(["es", "Spanish", null, 1000]);
  });

  it("deleteLanguage tombstones the language and its notes + decks", async () => {
    const { db, calls } = fakeDb();
    const repo = createLanguagesRepository(db, now);
    await repo.deleteLanguage("es");
    expect(calls.some((c) => c.query.includes("languages") && c.query.includes("deleted_at"))).toBe(true);
    expect(calls.some((c) => c.query.includes("notes") && c.query.includes("language_id"))).toBe(true);
    expect(calls.some((c) => c.query.includes("decks") && c.query.includes("language_id"))).toBe(true);
  });

  it("setContentFont updates the per-language font", async () => {
    const { db, calls } = fakeDb();
    const repo = createLanguagesRepository(db, now);
    await repo.setContentFont("ja", "Noto Serif JP");
    expect(calls[0].query).toContain("SET content_font");
    expect(calls[0].params).toEqual(["Noto Serif JP", 1000, "ja"]);
  });
});
