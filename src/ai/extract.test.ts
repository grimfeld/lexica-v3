import { describe, it, expect, vi } from "vitest";
import {
  extractCandidates,
  parseCandidatesJson,
  filterValidCandidates,
  type ExtractableType,
} from "./extract";
import type { ChatClient } from "./chat";

const TYPES: ExtractableType[] = [
  {
    id: "vocab",
    name: "Vocab",
    fields: [
      { key: "front", label: "Front", kind: "text", required: true },
      { key: "back", label: "Back", kind: "text", required: true },
    ],
  },
  {
    id: "cloze",
    name: "Cloze",
    fields: [{ key: "text", label: "Sentence", kind: "longtext", required: true }],
  },
];

const reply = (s: string): ChatClient => ({ complete: vi.fn(async () => s) });

describe("parseCandidatesJson", () => {
  it("parses a bare array", () => {
    expect(parseCandidatesJson('[{"type":"vocab"}]')).toEqual([{ type: "vocab" }]);
  });
  it("strips fences and surrounding prose", () => {
    expect(parseCandidatesJson('```json\n[{"a":1}]\n``` done')).toEqual([{ a: 1 }]);
  });
  it("returns null when not an array", () => {
    expect(parseCandidatesJson('{"type":"vocab"}')).toBeNull();
    expect(parseCandidatesJson("garbage")).toBeNull();
  });
});

describe("filterValidCandidates", () => {
  it("keeps valid, drops unknown type, drops schema-invalid", () => {
    const raw = [
      { type: "vocab", fields: { front: "hello", back: "hola" } }, // valid
      { type: "made-up", fields: { x: 1 } }, // unknown type -> drop
      { type: "vocab", fields: { front: "only-front" } }, // missing required -> drop
      { type: "cloze", fields: { text: "el {{gato}} duerme" } }, // valid
      "not an object", // junk -> drop
      { type: "vocab", fields: "nope" }, // bad fields shape -> drop
    ];
    const out = filterValidCandidates(raw, TYPES);
    expect(out).toEqual([
      { type: "vocab", fields: { front: "hello", back: "hola" } },
      { type: "cloze", fields: { text: "el {{gato}} duerme" } },
    ]);
  });
});

describe("extractCandidates", () => {
  it("returns only valid candidates", async () => {
    const client = reply(
      '[{"type":"vocab","fields":{"front":"hello","back":"hola"}},' +
        '{"type":"vocab","fields":{"front":"x"}}]',
    );
    const r = await extractCandidates(client, TYPES, "some document");
    expect(r.ok).toBe(true);
    expect(r.candidates).toEqual([
      { type: "vocab", fields: { front: "hello", back: "hola" } },
    ]);
  });

  it("returns ok with an empty list when nothing valid is found", async () => {
    const r = await extractCandidates(reply("[]"), TYPES, "doc");
    expect(r.ok).toBe(true);
    expect(r.candidates).toEqual([]);
  });

  it("errors on a non-array reply", async () => {
    const r = await extractCandidates(reply("sorry, no"), TYPES, "doc");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/candidate list/);
  });

  it("rejects an empty document without calling the model", async () => {
    const c = { complete: vi.fn() };
    const r = await extractCandidates(c, TYPES, "   ");
    expect(r.ok).toBe(false);
    expect(c.complete).not.toHaveBeenCalled();
  });

  it("surfaces a provider error", async () => {
    const c: ChatClient = { complete: vi.fn().mockRejectedValue(new Error("429 rate limit")) };
    const r = await extractCandidates(c, TYPES, "doc");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("429");
  });
});
