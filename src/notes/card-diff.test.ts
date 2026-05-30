import { describe, it, expect } from "vitest";
import { diffCards } from "./card-diff";
import type { DerivedCard } from "../note-types/contract";

const card = (sliceKey: string, render: unknown): DerivedCard => ({ sliceKey, render });

describe("diffCards (ADR-0009 re-derivation)", () => {
  it("inserts cards whose slice is new", () => {
    const plan = diffCards([], [card("fwd", { a: 1 })]);
    expect(plan.insert.map((c) => c.sliceKey)).toEqual(["fwd"]);
    expect(plan.keep).toEqual([]);
    expect(plan.remove).toEqual([]);
    expect(plan.changed).toEqual([]);
  });

  it("removes cards whose slice is gone", () => {
    const plan = diffCards([card("rev", { a: 1 })], []);
    expect(plan.remove).toEqual(["rev"]);
    expect(plan.insert).toEqual([]);
  });

  it("keeps cards whose slice and content are unchanged", () => {
    const old = [card("fwd", { prompt: "perro", answer: "dog" })];
    const next = [card("fwd", { prompt: "perro", answer: "dog" })];
    const plan = diffCards(old, next);
    expect(plan.keep).toEqual(["fwd"]);
    expect(plan.changed).toEqual([]);
    expect(plan.insert).toEqual([]);
    expect(plan.remove).toEqual([]);
  });

  it("flags cards whose content changed (same slice, different render)", () => {
    const old = [card("fwd", { prompt: "perro", answer: "dog" })];
    const next = [card("fwd", { prompt: "perro", answer: "hound" })];
    const plan = diffCards(old, next);
    expect(plan.changed.map((c) => c.sliceKey)).toEqual(["fwd"]);
    // A changed card still carries its new render so the caller can update it.
    expect((plan.changed[0].next.render as { answer: string }).answer).toBe("hound");
    expect(plan.keep).toEqual([]);
  });

  it("handles a mixed edit: keep + change + insert + remove together", () => {
    const old = [
      card("a", { v: 1 }), // unchanged -> keep
      card("b", { v: 2 }), // changed   -> changed
      card("c", { v: 3 }), // gone      -> remove
    ];
    const next = [
      card("a", { v: 1 }),
      card("b", { v: 99 }),
      card("d", { v: 4 }), // new -> insert
    ];
    const plan = diffCards(old, next);
    expect(plan.keep).toEqual(["a"]);
    expect(plan.changed.map((c) => c.sliceKey)).toEqual(["b"]);
    expect(plan.remove).toEqual(["c"]);
    expect(plan.insert.map((c) => c.sliceKey)).toEqual(["d"]);
  });
});
