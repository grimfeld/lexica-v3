import { describe, it, expect, vi } from "vitest";
import { resolveIpa, parseIpaReply } from "./pipeline";
import { dictLookup } from "./dict";
import type { ChatClient } from "../ai/chat";

const chat = (reply: string): ChatClient => ({ complete: vi.fn(async () => reply) });

describe("dictLookup", () => {
  it("hits the seed map case-insensitively", () => {
    expect(dictLookup("es", "Hola")).toBe("ˈola");
    expect(dictLookup("es", "  gato ")).toBe("ˈɡato");
  });
  it("misses unknown words and languages", () => {
    expect(dictLookup("es", "zzz")).toBeNull();
    expect(dictLookup("de", "hola")).toBeNull();
  });
});

describe("parseIpaReply", () => {
  it("extracts from slashes or brackets", () => {
    expect(parseIpaReply("/ˈola/")).toBe("ˈola");
    expect(parseIpaReply("[ʃa]")).toBe("ʃa");
    expect(parseIpaReply("The IPA is /bɔ̃ʒuʁ/ roughly")).toBe("bɔ̃ʒuʁ");
  });
  it("accepts a short bare token", () => {
    expect(parseIpaReply("ˈola")).toBe("ˈola");
  });
  it("returns null on empty or rambling replies", () => {
    expect(parseIpaReply("")).toBeNull();
    expect(parseIpaReply("a".repeat(80))).toBeNull();
  });
});

describe("resolveIpa", () => {
  it("uses the dictionary first, without calling the LLM", async () => {
    const c = chat("/wrong/");
    const r = await resolveIpa("es", "hola", { chat: c });
    expect(r).toEqual({ ipa: "ˈola", source: "dict", failed: false });
    expect(c.complete).not.toHaveBeenCalled();
  });

  it("falls back to the LLM on a dict miss", async () => {
    const r = await resolveIpa("es", "murciélago", { chat: chat("/muɾˈθjelaɣo/") });
    expect(r).toEqual({ ipa: "muɾˈθjelaɣo", source: "llm", failed: false });
  });

  it("marks failed when the LLM errors (so it's retried)", async () => {
    const c: ChatClient = { complete: vi.fn().mockRejectedValue(new Error("500")) };
    const r = await resolveIpa("es", "xyz", { chat: c });
    expect(r).toEqual({ ipa: null, source: "none", failed: true });
  });

  it("marks failed when the LLM reply is unparseable", async () => {
    const r = await resolveIpa("es", "xyz", { chat: chat("I don't know") });
    expect(r.failed).toBe(true);
    expect(r.ipa).toBeNull();
  });

  it("returns null (not failed) when no client is available", async () => {
    const r = await resolveIpa("es", "xyz", { chat: null });
    expect(r).toEqual({ ipa: null, source: "none", failed: false });
  });

  it("handles empty text without work", async () => {
    const c = { complete: vi.fn() };
    const r = await resolveIpa("es", "  ", { chat: c });
    expect(r.ipa).toBeNull();
    expect(c.complete).not.toHaveBeenCalled();
  });
});
