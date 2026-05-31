import { describe, it, expect, vi } from "vitest";
import { assistFields, parseFieldsJson, describeFields } from "./authoring-assist";
import type { FieldDescriptor } from "../note-types/contract";
import type { ChatClient } from "./chat";

const FIELDS: FieldDescriptor[] = [
  { key: "front", label: "Front", kind: "text", required: true },
  { key: "back", label: "Back", kind: "text", required: true, ipa: true },
  { key: "notes", label: "Notes", kind: "longtext" },
];

function client(...replies: string[]): { client: ChatClient; calls: () => number } {
  let i = 0;
  return {
    client: {
      complete: vi.fn(async () => replies[Math.min(i++, replies.length - 1)]),
    },
    calls: () => i,
  };
}

describe("parseFieldsJson", () => {
  it("parses a bare JSON object", () => {
    expect(parseFieldsJson('{"front":"hola"}')).toEqual({ front: "hola" });
  });
  it("strips markdown fences", () => {
    expect(parseFieldsJson('```json\n{"front":"hola"}\n```')).toEqual({ front: "hola" });
  });
  it("extracts an object embedded in prose", () => {
    expect(parseFieldsJson('Here you go: {"front":"hola"} enjoy')).toEqual({ front: "hola" });
  });
  it("returns null for non-objects", () => {
    expect(parseFieldsJson("[1,2]")).toBeNull();
    expect(parseFieldsJson("not json")).toBeNull();
  });
});

describe("describeFields", () => {
  it("lists keys, kinds, and required markers", () => {
    const d = describeFields(FIELDS);
    expect(d).toContain('"front"');
    expect(d).toContain("(required)");
    expect(d).toContain("target-language text"); // ipa hint on back
  });
});

describe("assistFields", () => {
  it("returns validated fields on a good reply", async () => {
    const { client: c } = client('{"front":"hello","back":"hola"}');
    const r = await assistFields(c, "Vocab", FIELDS, "hola");
    expect(r.ok).toBe(true);
    expect(r.fields).toEqual({ front: "hello", back: "hola" });
  });

  it("retries when the first reply is invalid, then succeeds", async () => {
    const { client: c, calls } = client(
      '{"bogus":"x"}', // unknown key + missing required -> invalid
      '{"front":"hello","back":"hola"}',
    );
    const r = await assistFields(c, "Vocab", FIELDS, "hola");
    expect(r.ok).toBe(true);
    expect(calls()).toBe(2);
  });

  it("retries malformed JSON", async () => {
    const { client: c, calls } = client("sorry no", '{"front":"a","back":"b"}');
    const r = await assistFields(c, "Vocab", FIELDS, "hola");
    expect(r.ok).toBe(true);
    expect(calls()).toBe(2);
  });

  it("fails after exhausting retries on persistently invalid output", async () => {
    const { client: c } = client('{"unknown":"1"}', '{"still":"bad"}');
    const r = await assistFields(c, "Vocab", FIELDS, "hola");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/didn't match/);
  });

  it("rejects an empty seed without calling the model", async () => {
    const c = { complete: vi.fn() };
    const r = await assistFields(c, "Vocab", FIELDS, "   ");
    expect(r.ok).toBe(false);
    expect(c.complete).not.toHaveBeenCalled();
  });

  it("surfaces a provider error", async () => {
    const c: ChatClient = { complete: vi.fn().mockRejectedValue(new Error("401 bad key")) };
    const r = await assistFields(c, "Vocab", FIELDS, "hola");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("401");
  });
});
