import { describe, it, expect } from "vitest";
import {
  makeBundle,
  serializeBundle,
  parseBundle,
  BUNDLE_VERSION,
} from "./bundle";

const tables = {
  languages: [{ id: "es", name: "Spanish" }],
  notes: [{ id: "n1", language_id: "es" }],
  cards: [{ id: "n1:fwd", note_id: "n1" }],
  decks: [],
  deckNotes: [],
};

describe("backup bundle codec", () => {
  it("round-trips through serialize/parse", () => {
    const bundle = makeBundle(tables, 1234);
    const result = parseBundle(serializeBundle(bundle));
    expect(result.ok).toBe(true);
    expect(result.bundle?.version).toBe(BUNDLE_VERSION);
    expect(result.bundle?.exportedAt).toBe(1234);
    expect(result.bundle?.notes).toEqual(tables.notes);
  });

  it("rejects non-JSON", () => {
    expect(parseBundle("not json").ok).toBe(false);
  });

  it("rejects an unsupported version", () => {
    const bad = JSON.stringify({ ...makeBundle(tables, 0), version: 99 });
    const r = parseBundle(bad);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/version/);
  });

  it("rejects a bundle missing a table", () => {
    const bundle = makeBundle(tables, 0) as unknown as Record<string, unknown>;
    delete bundle.cards;
    const r = parseBundle(JSON.stringify(bundle));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/cards/);
  });
});
