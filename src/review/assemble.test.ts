import { describe, it, expect, beforeEach } from "vitest";
import { assembleReviewItems, type DueCard, type NoteSource } from "./assemble";
import { registerNoteType, __resetRegistry } from "../note-types/registry";
import { vocabNoteType } from "../note-types/vocab";

beforeEach(() => {
  __resetRegistry();
  registerNoteType(vocabNoteType);
});

const notes = new Map<string, NoteSource>([
  ["n1", { id: "n1", type: "vocab", fields: { term: "perro", meaning: "dog", notes: "" } }],
]);

describe("assembleReviewItems", () => {
  it("derives the render payload matching each due card's slice", () => {
    const due: DueCard[] = [
      { cardId: "n1:fwd", noteId: "n1", sliceKey: "fwd", ipa: "ˈpe.ro" },
    ];
    const items = assembleReviewItems(due, notes);
    expect(items).toHaveLength(1);
    expect((items[0].render as { prompt: string }).prompt).toBe("perro");
    expect(items[0].ipa).toBe("ˈpe.ro");
  });

  it("skips a due card whose slice no longer derives", () => {
    const due: DueCard[] = [
      { cardId: "n1:ghost", noteId: "n1", sliceKey: "ghost", ipa: null },
    ];
    expect(assembleReviewItems(due, notes)).toHaveLength(0);
  });

  it("skips a due card whose note is missing", () => {
    const due: DueCard[] = [
      { cardId: "x:fwd", noteId: "missing", sliceKey: "fwd", ipa: null },
    ];
    expect(assembleReviewItems(due, notes)).toHaveLength(0);
  });
});
