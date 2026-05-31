import { describe, it, expect } from "vitest";
import { resolvePair, reconcile, type SyncRecord } from "./reconcile";

const rec = (over: Partial<SyncRecord> & { id: string }): SyncRecord => ({
  updatedAt: 0,
  deletedAt: null,
  ...over,
});

describe("resolvePair — content LWW", () => {
  it("local wins when updated later", () => {
    const r = resolvePair(rec({ id: "a", updatedAt: 20 }), rec({ id: "a", updatedAt: 10 }));
    expect(r).toMatchObject({ winner: "local", action: "push" });
  });

  it("remote wins when updated later", () => {
    const r = resolvePair(rec({ id: "a", updatedAt: 10 }), rec({ id: "a", updatedAt: 20 }));
    expect(r).toMatchObject({ winner: "remote", action: "pull" });
  });

  it("ties favour the shared copy (noop)", () => {
    const r = resolvePair(rec({ id: "a", updatedAt: 10 }), rec({ id: "a", updatedAt: 10 }));
    expect(r).toMatchObject({ winner: "equal", action: "noop" });
  });

  it("a more recent delete beats an older edit", () => {
    // local deleted at 30 (its updatedAt moves with the tombstone), remote edited at 20
    const r = resolvePair(
      rec({ id: "a", updatedAt: 30, deletedAt: 30 }),
      rec({ id: "a", updatedAt: 20 }),
    );
    expect(r).toMatchObject({ winner: "local", action: "push" });
  });

  it("a more recent edit beats an older delete", () => {
    const r = resolvePair(
      rec({ id: "a", updatedAt: 15, deletedAt: 15 }),
      rec({ id: "a", updatedAt: 40 }),
    );
    expect(r).toMatchObject({ winner: "remote", action: "pull" });
  });
});

describe("resolvePair — card last-review-wins", () => {
  it("the more recently REVIEWED card wins even if the other row was touched later", () => {
    // remote row updatedAt is later, but local was reviewed more recently.
    const local = rec({ id: "c", updatedAt: 10, lastReviewAt: 100 });
    const remote = rec({ id: "c", updatedAt: 50, lastReviewAt: 40 });
    const r = resolvePair(local, remote, true);
    expect(r).toMatchObject({ winner: "local", action: "push" });
  });

  it("falls back to updatedAt when a side has no review yet", () => {
    const local = rec({ id: "c", updatedAt: 10, lastReviewAt: null });
    const remote = rec({ id: "c", updatedAt: 50, lastReviewAt: null });
    const r = resolvePair(local, remote, true);
    expect(r.winner).toBe("remote");
  });
});

describe("reconcile — full sets", () => {
  it("pushes local-only and pulls remote-only", () => {
    const plan = reconcile(
      [rec({ id: "l1" }), rec({ id: "both", updatedAt: 5 })],
      [rec({ id: "r1" }), rec({ id: "both", updatedAt: 5 })],
    );
    expect(plan.push).toEqual(["l1"]); // both ties -> noop
    expect(plan.pull).toEqual(["r1"]);
  });

  it("routes each shared record by the winner", () => {
    const plan = reconcile(
      [rec({ id: "x", updatedAt: 9 }), rec({ id: "y", updatedAt: 30 })],
      [rec({ id: "x", updatedAt: 20 }), rec({ id: "y", updatedAt: 10 })],
    );
    expect(plan.push).toEqual(["y"]); // local newer
    expect(plan.pull).toEqual(["x"]); // remote newer
  });

  it("uses the review policy for cards across the whole set", () => {
    const plan = reconcile(
      [rec({ id: "c", updatedAt: 1, lastReviewAt: 99 })],
      [rec({ id: "c", updatedAt: 100, lastReviewAt: 5 })],
      true,
    );
    expect(plan.push).toEqual(["c"]);
    expect(plan.pull).toEqual([]);
  });
});
