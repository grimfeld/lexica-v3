import { describe, it, expect } from "vitest";
import { ttsKey, normalizeText } from "./key";

describe("normalizeText", () => {
  it("trims, collapses whitespace, lowercases", () => {
    expect(normalizeText("  Hola   Mundo ")).toBe("hola mundo");
  });
});

describe("ttsKey", () => {
  it("is deterministic for the same text + language", () => {
    expect(ttsKey("es", "hola")).toBe(ttsKey("es", "hola"));
  });

  it("ignores trivial whitespace/case differences", () => {
    expect(ttsKey("es", "Hola")).toBe(ttsKey("es", "  hola "));
  });

  it("differs by language for the same text", () => {
    expect(ttsKey("es", "hola")).not.toBe(ttsKey("fr", "hola"));
  });

  it("differs by text within a language", () => {
    expect(ttsKey("es", "hola")).not.toBe(ttsKey("es", "adios"));
  });

  it("is namespaced by language id", () => {
    expect(ttsKey("es", "hola").startsWith("es:")).toBe(true);
  });
});
