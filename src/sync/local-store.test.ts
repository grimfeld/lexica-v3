import { describe, it, expect } from "vitest";
import { createLocalStore, createSyncStateRepo } from "./local-store";
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

describe("local-store — all()", () => {
  it("normalizes snake_case sync columns", async () => {
    const { db } = fakeDb([{ id: "n1", updated_at: 42, deleted_at: null, fields: "{}" }]);
    const store = createLocalStore(db);
    const rows = await store.all("notes");
    expect(rows[0]).toMatchObject({ id: "n1", updatedAt: 42, deletedAt: null });
  });

  it("exposes a card's FSRS last_review as lastReviewAt", async () => {
    const fsrs = JSON.stringify({ last_review: "2026-01-02T00:00:00.000Z" });
    const { db } = fakeDb([{ id: "c1", updated_at: 10, deleted_at: null, fsrs }]);
    const rows = await createLocalStore(db).all("cards");
    expect(rows[0].lastReviewAt).toBe(new Date("2026-01-02T00:00:00.000Z").getTime());
  });

  it("yields null lastReviewAt for an unreviewed card", async () => {
    const fsrs = JSON.stringify({ last_review: null });
    const { db } = fakeDb([{ id: "c1", updated_at: 10, deleted_at: null, fsrs }]);
    const rows = await createLocalStore(db).all("cards");
    expect(rows[0].lastReviewAt).toBeNull();
  });
});

describe("local-store — apply()", () => {
  it("upserts without the engine's alias columns", async () => {
    const { db, calls } = fakeDb();
    const store = createLocalStore(db);
    await store.apply("notes", [
      { id: "n1", updatedAt: 42, deletedAt: null, updated_at: 42, deleted_at: null, fields: "{}" },
    ]);
    const insert = calls.find((c) => c.query.includes("INSERT OR REPLACE"))!;
    // Alias columns must not be written as DB columns.
    expect(insert.query).not.toContain("updatedAt");
    expect(insert.query).not.toContain("lastReviewAt");
    expect(insert.query).toContain("updated_at");
  });
});

describe("watermark", () => {
  it("defaults to 0 when unset", async () => {
    const { db } = fakeDb([]);
    expect(await createSyncStateRepo(db).getWatermark()).toBe(0);
  });

  it("round-trips a value", async () => {
    const { db } = fakeDb([{ value: "9999" }]);
    expect(await createSyncStateRepo(db).getWatermark()).toBe(9999);
  });
});
