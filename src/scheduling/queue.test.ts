import { describe, it, expect } from "vitest";
import { buildSessionQueue, type QueueCard } from "./queue";

const card = (id: string, noteId: string, dueOffsetMs: number): QueueCard => ({
  id,
  noteId,
  due: new Date(1_000_000 + dueOffsetMs),
});

const NOW = new Date(2_000_000);

describe("buildSessionQueue", () => {
  it("includes only due cards", () => {
    const q = buildSessionQueue(
      [card("a", "n1", 0), card("b", "n2", 5_000_000)], // b due in the future
      NOW,
    );
    expect(q.map((c) => c.id)).toEqual(["a"]);
  });

  it("never places two cards from the same note back-to-back when avoidable", () => {
    const cards = [
      card("a1", "n1", 0),
      card("a2", "n1", 0),
      card("a3", "n1", 0),
      card("b1", "n2", 0),
      card("b2", "n2", 0),
      card("c1", "n3", 0),
    ];
    const q = buildSessionQueue(cards, NOW);
    for (let i = 1; i < q.length; i++) {
      expect(q[i].noteId).not.toBe(q[i - 1].noteId);
    }
  });

  it("still returns every due card (throttle reorders, never drops)", () => {
    const cards = [
      card("a1", "n1", 0),
      card("a2", "n1", 0),
      card("a3", "n1", 0),
      card("b1", "n2", 0),
    ];
    const q = buildSessionQueue(cards, NOW);
    expect(q.map((c) => c.id).sort()).toEqual(["a1", "a2", "a3", "b1"]);
  });

  it("allows adjacency only when one note dominates the remaining pool", () => {
    // 3 from n1, nothing else -> adjacency unavoidable, must still return all 3
    const cards = [card("a1", "n1", 0), card("a2", "n1", 0), card("a3", "n1", 0)];
    const q = buildSessionQueue(cards, NOW);
    expect(q).toHaveLength(3);
  });
});
