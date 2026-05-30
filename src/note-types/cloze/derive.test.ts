import { describe, it, expect } from "vitest";
import { deriveClozeCards, parseCloze, MASK } from "./derive";
import type { ClozeRender } from "./derive";

describe("parseCloze", () => {
  it("extracts blanks in order with their text", () => {
    const { blanks } = parseCloze("Je {{suis}} tres {{content}}.");
    expect(blanks).toEqual([
      { index: 0, answer: "suis" },
      { index: 1, answer: "content" },
    ]);
  });

  it("returns no blanks for plain text", () => {
    expect(parseCloze("no blanks here").blanks).toEqual([]);
  });
});

describe("deriveClozeCards", () => {
  const fields = { text: "Je {{suis}} tres {{content}}.", notes: "mood" };

  it("derives one card per blank with stable blank:N sliceKeys", () => {
    const cards = deriveClozeCards(fields);
    expect(cards.map((c) => c.sliceKey)).toEqual(["blank:0", "blank:1"]);
  });

  it("prompt masks the target blank but shows the others filled", () => {
    const first = deriveClozeCards(fields)[0].render as ClozeRender;
    expect(first.prompt).toBe(`Je ${MASK} tres content.`);
    expect(first.answer).toBe("suis");
  });

  it("masks the second blank independently", () => {
    const second = deriveClozeCards(fields)[1].render as ClozeRender;
    expect(second.prompt).toBe(`Je suis tres ${MASK}.`);
    expect(second.answer).toBe("content");
  });

  it("derives no cards when there are no blanks", () => {
    expect(deriveClozeCards({ text: "no blanks", notes: "" })).toEqual([]);
  });

  it("sliceKeys stay stable when other text is edited (ADR-0009)", () => {
    const a = deriveClozeCards(fields).map((c) => c.sliceKey);
    const b = deriveClozeCards({ ...fields, text: "Moi je {{suis}} tres {{content}} !" }).map(
      (c) => c.sliceKey,
    );
    expect(a).toEqual(b);
  });
});
