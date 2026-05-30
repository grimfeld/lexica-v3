import { describe, it, expect, beforeEach } from "vitest";
import {
  registerNoteType,
  getNoteType,
  listNoteTypes,
  __resetRegistry,
} from "./registry";
import type { NoteTypeModule } from "./contract";

const stub = (id: string): NoteTypeModule => ({
  id,
  name: id,
  fields: [],
  deriveCards: () => [],
  ReviewRenderer: () => null,
  AuthoringForm: () => null,
});

describe("note type registry", () => {
  beforeEach(() => __resetRegistry());

  it("registers and retrieves a module by id", () => {
    const m = stub("vocab");
    registerNoteType(m);
    expect(getNoteType("vocab")).toBe(m);
  });

  it("lists registered modules", () => {
    registerNoteType(stub("vocab"));
    registerNoteType(stub("cloze"));
    expect(listNoteTypes().map((m) => m.id).sort()).toEqual(["cloze", "vocab"]);
  });

  it("throws on duplicate registration", () => {
    registerNoteType(stub("vocab"));
    expect(() => registerNoteType(stub("vocab"))).toThrow(/already registered/);
  });

  it("throws on unknown id", () => {
    expect(() => getNoteType("nope")).toThrow(/Unknown Note Type/);
  });
});
