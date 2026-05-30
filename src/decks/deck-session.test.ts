import { describe, it, expect } from "vitest";
import { dueCardsForDeck } from "./deck-session";
import type { DueCard } from "../review/assemble";

const due: DueCard[] = [
  { cardId: "n1:fwd", noteId: "n1", sliceKey: "fwd", ipa: null },
  { cardId: "n2:fwd", noteId: "n2", sliceKey: "fwd", ipa: null },
  { cardId: "n3:fwd", noteId: "n3", sliceKey: "fwd", ipa: null },
];

describe("dueCardsForDeck", () => {
  it("keeps only cards whose note is in the deck", () => {
    const out = dueCardsForDeck(due, ["n1", "n3"]);
    expect(out.map((c) => c.cardId)).toEqual(["n1:fwd", "n3:fwd"]);
  });

  it("returns empty when the deck has no due notes", () => {
    expect(dueCardsForDeck(due, ["n9"])).toEqual([]);
  });
});
