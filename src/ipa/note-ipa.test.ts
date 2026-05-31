import { describe, it, expect, beforeEach } from "vitest";
import { ipaFieldValues } from "./note-ipa";
import { registerNoteType, __resetRegistry } from "../note-types/registry";
import { vocabNoteType } from "../note-types/vocab";

beforeEach(() => {
  __resetRegistry();
  registerNoteType(vocabNoteType);
});

describe("ipaFieldValues", () => {
  it("returns only IPA-bearing fields with string values", () => {
    const ipaKeys = vocabNoteType.fields.filter((f) => f.ipa).map((f) => f.key);
    expect(ipaKeys.length).toBeGreaterThan(0);
    const key = ipaKeys[0];
    const values = ipaFieldValues("vocab", { [key]: "perro" });
    expect(values).toContainEqual({ fieldKey: key, text: "perro" });
  });

  it("omits non-IPA fields", () => {
    const nonIpa = vocabNoteType.fields.find((f) => !f.ipa)?.key;
    const values = ipaFieldValues("vocab", nonIpa ? { [nonIpa]: "x" } : {});
    expect(values.find((v) => v.fieldKey === nonIpa)).toBeUndefined();
  });
});
