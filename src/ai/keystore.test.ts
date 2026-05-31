import { describe, it, expect } from "vitest";
import { createKeyStore, inMemoryBackend } from "./keystore";

const KNOWN = ["anthropic", "openai", "elevenlabs"];

describe("BYOK key store", () => {
  it("stores and retrieves a key per provider", async () => {
    const ks = createKeyStore(inMemoryBackend(), KNOWN);
    await ks.setKey("anthropic", "sk-ant-123");
    expect(await ks.getKey("anthropic")).toBe("sk-ant-123");
    expect(await ks.getKey("openai")).toBeNull();
  });

  it("trims whitespace before storing", async () => {
    const ks = createKeyStore(inMemoryBackend(), KNOWN);
    await ks.setKey("openai", "  sk-abc  ");
    expect(await ks.getKey("openai")).toBe("sk-abc");
  });

  it("treats an empty/whitespace key as a clear", async () => {
    const ks = createKeyStore(inMemoryBackend({ openai: "sk-abc" }), KNOWN);
    await ks.setKey("openai", "   ");
    expect(await ks.getKey("openai")).toBeNull();
    expect(await ks.hasKey("openai")).toBe(false);
  });

  it("clears a key explicitly", async () => {
    const ks = createKeyStore(inMemoryBackend({ anthropic: "sk-1" }), KNOWN);
    await ks.clearKey("anthropic");
    expect(await ks.hasKey("anthropic")).toBe(false);
  });

  it("reports which providers have keys without exposing values", async () => {
    const ks = createKeyStore(inMemoryBackend({ anthropic: "a", elevenlabs: "e" }), KNOWN);
    const ids = await ks.providersWithKeys();
    expect(ids.sort()).toEqual(["anthropic", "elevenlabs"]);
  });

  it("does not surface a stored blank value as a key", async () => {
    // A backend that somehow holds "" should still read as no key.
    const ks = createKeyStore(inMemoryBackend({ openai: "" }), KNOWN);
    expect(await ks.hasKey("openai")).toBe(false);
  });
});
