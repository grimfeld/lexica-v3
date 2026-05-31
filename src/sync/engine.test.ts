import { describe, it, expect, vi } from "vitest";
import { syncTable, syncAll, type RemoteStore, type LocalStore, type SyncRow } from "./engine";

const row = (id: string, updatedAt: number, extra: Partial<SyncRow> = {}): SyncRow => ({
  id,
  updatedAt,
  deletedAt: null,
  ...extra,
});

function stores(localRows: SyncRow[], remoteRows: SyncRow[]) {
  const applied: SyncRow[] = [];
  const pushed: SyncRow[] = [];
  const cleared: string[] = [];
  const remote: RemoteStore = {
    pull: vi.fn(async () => remoteRows),
    push: vi.fn(async (_c, rows) => {
      pushed.push(...rows);
    }),
  };
  const local: LocalStore = {
    all: vi.fn(async () => localRows),
    apply: vi.fn(async (_t, rows) => {
      applied.push(...rows);
    }),
    clearDirty: vi.fn(async (_t, ids) => {
      cleared.push(...ids);
    }),
  };
  return { remote, local, applied, pushed, cleared };
}

const T = { table: "notes", collection: "notes" };

describe("syncTable", () => {
  it("pulls remote-won rows and applies them locally", async () => {
    const { remote, local, applied } = stores([row("a", 5)], [row("a", 9)]);
    const res = await syncTable(T, 0, remote, local);
    expect(applied.map((r) => r.id)).toEqual(["a"]);
    expect(res.pulled).toBe(1);
    expect(res.pushed).toBe(0);
  });

  it("pushes local-won rows and clears their dirty flag", async () => {
    const { remote, local, pushed, cleared } = stores([row("a", 9)], [row("a", 5)]);
    const res = await syncTable(T, 0, remote, local);
    expect(pushed.map((r) => r.id)).toEqual(["a"]);
    expect(cleared).toEqual(["a"]);
    expect(res.pushed).toBe(1);
  });

  it("moves local-only rows up and remote-only rows down", async () => {
    const { remote, local, applied, pushed } = stores([row("local", 1)], [row("remote", 1)]);
    await syncTable(T, 0, remote, local);
    expect(pushed.map((r) => r.id)).toEqual(["local"]);
    expect(applied.map((r) => r.id)).toEqual(["remote"]);
  });

  it("does nothing on a tie", async () => {
    const { remote, local, applied, pushed, cleared } = stores([row("a", 5)], [row("a", 5)]);
    await syncTable(T, 0, remote, local);
    expect(applied).toEqual([]);
    expect(pushed).toEqual([]);
    expect(cleared).toEqual([]);
  });

  it("carries tombstones through a pull", async () => {
    const { remote, local, applied } = stores([row("a", 1)], [row("a", 9, { deletedAt: 9 })]);
    await syncTable(T, 0, remote, local);
    expect(applied[0]).toMatchObject({ id: "a", deletedAt: 9 });
  });

  it("propagates the watermark to the remote pull", async () => {
    const { remote, local } = stores([], []);
    await syncTable(T, 1234, remote, local);
    expect(remote.pull).toHaveBeenCalledWith("notes", 1234);
  });
});

describe("syncAll", () => {
  it("syncs tables in order and returns per-table results", async () => {
    const { remote, local } = stores([], []);
    const results = await syncAll(
      [
        { table: "languages", collection: "languages" },
        { table: "cards", collection: "cards", useReview: true },
      ],
      0,
      remote,
      local,
    );
    expect(results.map((r) => r.table)).toEqual(["languages", "cards"]);
  });
});
