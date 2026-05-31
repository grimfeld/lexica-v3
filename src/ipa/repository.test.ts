import { describe, it, expect } from "vitest";
import { createPronunciationsRepository, type PronRow } from "./repository";
import type { SqlExecutor } from "../notes/repository";

interface Call {
  query: string;
  params: unknown[];
}

function fakeDb(existing: PronRow[] = []) {
  const calls: Call[] = [];
  const db: SqlExecutor = {
    execute: async (query, params = []) => {
      calls.push({ query, params });
    },
    select: async () => existing as never,
  };
  return { db, calls };
}

const now = () => 1000;
const inserts = (c: Call[]) => c.filter((x) => x.query.includes("INSERT"));
const updates = (c: Call[]) => c.filter((x) => x.query.includes("UPDATE"));

describe("pronunciations repository — enqueueForNote", () => {
  it("inserts a pending row for a new IPA field", async () => {
    const { db, calls } = fakeDb([]);
    const repo = createPronunciationsRepository(db, now);
    await repo.enqueueForNote("n1", [{ fieldKey: "back", text: "hola" }]);
    const ins = inserts(calls);
    expect(ins).toHaveLength(1);
    expect(ins[0].params).toEqual(["n1:back", "n1", "back", "hola", 1000]);
  });

  it("skips empty field values", async () => {
    const { db, calls } = fakeDb([]);
    const repo = createPronunciationsRepository(db, now);
    await repo.enqueueForNote("n1", [{ fieldKey: "back", text: "  " }]);
    expect(inserts(calls)).toHaveLength(0);
  });

  it("leaves an unchanged field alone (no re-queue)", async () => {
    const existing: PronRow[] = [
      { id: "n1:back", noteId: "n1", fieldKey: "back", sourceText: "hola", ipa: "ˈola", status: "done" },
    ];
    const { db, calls } = fakeDb(existing);
    const repo = createPronunciationsRepository(db, now);
    await repo.enqueueForNote("n1", [{ fieldKey: "back", text: "hola" }]);
    expect(inserts(calls)).toHaveLength(0);
    expect(updates(calls)).toHaveLength(0);
  });

  it("re-queues a field whose source text changed (stale)", async () => {
    const existing: PronRow[] = [
      { id: "n1:back", noteId: "n1", fieldKey: "back", sourceText: "hola", ipa: "ˈola", status: "done" },
    ];
    const { db, calls } = fakeDb(existing);
    const repo = createPronunciationsRepository(db, now);
    await repo.enqueueForNote("n1", [{ fieldKey: "back", text: "adiós" }]);
    const ups = updates(calls);
    expect(ups).toHaveLength(1);
    expect(ups[0].query).toContain("status = 'pending'");
    expect(ups[0].query).toContain("ipa = NULL");
  });

  it("tombstones a row whose field is no longer present", async () => {
    const existing: PronRow[] = [
      { id: "n1:back", noteId: "n1", fieldKey: "back", sourceText: "hola", ipa: "ˈola", status: "done" },
    ];
    const { db, calls } = fakeDb(existing);
    const repo = createPronunciationsRepository(db, now);
    await repo.enqueueForNote("n1", []); // field gone
    const ups = updates(calls);
    expect(ups).toHaveLength(1);
    expect(ups[0].query).toContain("deleted_at");
  });
});

describe("pronunciations repository — resolve", () => {
  it("stores IPA with status done on success", async () => {
    const { db, calls } = fakeDb();
    const repo = createPronunciationsRepository(db, now);
    await repo.resolve("n1:back", "ˈola", false);
    expect(calls[0].params).toEqual(["ˈola", "done", 1000, "n1:back"]);
  });

  it("marks failed for retry", async () => {
    const { db, calls } = fakeDb();
    const repo = createPronunciationsRepository(db, now);
    await repo.resolve("n1:back", null, true);
    expect(calls[0].params).toEqual([null, "failed", 1000, "n1:back"]);
  });
});
