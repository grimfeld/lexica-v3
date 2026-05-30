import { describe, it, expect } from "vitest";
import { deriveConjugationCards, TENSES, PERSONS } from "./derive";
import type { ConjugationRender } from "./derive";

const fields = {
  verb: "être",
  table: {
    present: { je: "suis", tu: "es", il: "est" },
    past: { je: "étais", tu: "", il: "" }, // tu/il empty -> no cards
  },
  notes: "irregular",
};

describe("deriveConjugationCards", () => {
  it("derives one card per FILLED cell", () => {
    const cards = deriveConjugationCards(fields);
    // present: 3 filled, past: 1 filled -> 4
    expect(cards).toHaveLength(4);
  });

  it("uses stable tense/person sliceKeys (ADR-0009)", () => {
    const keys = deriveConjugationCards(fields).map((c) => c.sliceKey).sort();
    expect(keys).toEqual([
      "past/je",
      "present/il",
      "present/je",
      "present/tu",
    ]);
  });

  it("prompts the verb + tense + person, answers the cell", () => {
    const card = deriveConjugationCards(fields).find((c) => c.sliceKey === "present/tu")!;
    const r = card.render as ConjugationRender;
    expect(r.verb).toBe("être");
    expect(r.tense).toBe("present");
    expect(r.person).toBe("tu");
    expect(r.answer).toBe("es");
  });

  it("skips empty cells entirely", () => {
    const keys = deriveConjugationCards(fields).map((c) => c.sliceKey);
    expect(keys).not.toContain("past/tu");
    expect(keys).not.toContain("past/il");
  });

  it("derives nothing when the table is empty", () => {
    expect(deriveConjugationCards({ verb: "être", table: {}, notes: "" })).toEqual([]);
  });

  it("exposes the canonical tense/person axes", () => {
    expect(TENSES.length).toBeGreaterThan(0);
    expect(PERSONS.length).toBeGreaterThan(0);
  });
});
