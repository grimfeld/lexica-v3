import { describe, it, expect } from "vitest";
import { createSession, reveal, gradeAndAdvance, type ReviewItem } from "./session";

const item = (cardId: string): ReviewItem => ({
  cardId,
  noteId: "n",
  typeId: "vocab",
  render: { prompt: "p", answer: "a" },
  ipa: null,
});

const items = [item("c1"), item("c2"), item("c3")];

describe("review session state machine", () => {
  it("starts on the first card, not revealed, with progress 0/N", () => {
    const s = createSession(items);
    expect(s.current?.cardId).toBe("c1");
    expect(s.revealed).toBe(false);
    expect(s.done).toBe(false);
    expect(s.completed).toBe(0);
    expect(s.total).toBe(3);
  });

  it("reveal flips the revealed flag without advancing", () => {
    const s = reveal(createSession(items));
    expect(s.revealed).toBe(true);
    expect(s.current?.cardId).toBe("c1");
  });

  it("grading advances to the next card and re-hides the answer", () => {
    let s = reveal(createSession(items));
    const graded: { cardId: string; pass: boolean }[] = [];
    s = gradeAndAdvance(s, true, (cardId, pass) => graded.push({ cardId, pass }));
    expect(graded).toEqual([{ cardId: "c1", pass: true }]);
    expect(s.current?.cardId).toBe("c2");
    expect(s.revealed).toBe(false);
    expect(s.completed).toBe(1);
  });

  it("reaches done after the last card is graded", () => {
    let s = createSession(items);
    for (let i = 0; i < items.length; i++) s = gradeAndAdvance(reveal(s), true, () => {});
    expect(s.done).toBe(true);
    expect(s.current).toBeNull();
    expect(s.completed).toBe(3);
  });

  it("an empty queue is immediately done", () => {
    const s = createSession([]);
    expect(s.done).toBe(true);
    expect(s.current).toBeNull();
  });
});
