import { describe, it, expect } from "vitest";
import { deriveVocabCards } from "./derive";
import type { VocabRender } from "./derive";

describe("deriveVocabCards", () => {
  const fields = { term: "perro", meaning: "dog", notes: "el perro · m." };

  it("derives exactly two cards, both directions", () => {
    const cards = deriveVocabCards(fields);
    expect(cards.map((c) => c.sliceKey).sort()).toEqual(["fwd", "rev"]);
  });

  it("forward card prompts the term, answers the meaning", () => {
    const fwd = deriveVocabCards(fields).find((c) => c.sliceKey === "fwd")!;
    const r = fwd.render as VocabRender;
    expect(r.prompt).toBe("perro");
    expect(r.answer).toBe("dog");
    // Prompt side is target language -> eligible for IPA aid on reveal.
    expect(r.promptIsTarget).toBe(true);
  });

  it("reverse card prompts the meaning, answers the term", () => {
    const rev = deriveVocabCards(fields).find((c) => c.sliceKey === "rev")!;
    const r = rev.render as VocabRender;
    expect(r.prompt).toBe("dog");
    expect(r.answer).toBe("perro");
    expect(r.promptIsTarget).toBe(false);
  });

  it("carries notes through to both cards", () => {
    const cards = deriveVocabCards(fields);
    for (const c of cards) {
      expect((c.render as VocabRender).notes).toBe("el perro · m.");
    }
  });

  it("derives no cards when term or meaning is empty", () => {
    expect(deriveVocabCards({ term: "", meaning: "dog" })).toEqual([]);
    expect(deriveVocabCards({ term: "perro", meaning: "" })).toEqual([]);
  });

  it("sliceKeys are stable across calls (ADR-0009 edit-diff)", () => {
    const a = deriveVocabCards(fields).map((c) => c.sliceKey);
    const b = deriveVocabCards({ ...fields, meaning: "hound" }).map((c) => c.sliceKey);
    expect(a).toEqual(b);
  });
});
