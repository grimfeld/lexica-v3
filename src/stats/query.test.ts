import { describe, it, expect } from "vitest";
import { createStatsQuery } from "./query";
import type { SqlExecutor } from "../notes/repository";

function fakeDb(rows: { fsrs: string }[]) {
  const db: SqlExecutor = {
    execute: async () => {},
    select: async () => rows as never,
  };
  return db;
}

describe("stats query", () => {
  it("parses fsrs JSON and computes retention for a language", async () => {
    const db = fakeDb([
      { fsrs: JSON.stringify({ state: 2, reps: 10, lapses: 1 }) },
      { fsrs: JSON.stringify({ state: 2, reps: 10, lapses: 1 }) },
    ]);
    const stats = createStatsQuery(db);
    const s = await stats.forLanguage("es");
    expect(s.totalCards).toBe(2);
    expect(s.matureCards).toBe(2);
    expect(s.retentionRate).toBeCloseTo(0.9);
  });

  it("tolerates missing fsrs fields", async () => {
    const db = fakeDb([{ fsrs: JSON.stringify({}) }]);
    const stats = createStatsQuery(db);
    const s = await stats.forLanguage("es");
    expect(s.totalCards).toBe(1);
    expect(s.newCards).toBe(1); // state defaults to 0 (New)
    expect(s.retentionRate).toBeNull();
  });
});
