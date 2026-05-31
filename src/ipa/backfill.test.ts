import { describe, it, expect, vi } from "vitest";
import { runBackfill } from "./backfill";
import type { PronRow } from "./repository";
import type { ChatClient } from "../ai/chat";

const row = (over: Partial<PronRow>): PronRow => ({
  id: "n1:back",
  noteId: "n1",
  fieldKey: "back",
  sourceText: "hola",
  ipa: null,
  status: "pending",
  ...over,
});

function repo(queued: PronRow[]) {
  const resolved: { id: string; ipa: string | null; failed: boolean }[] = [];
  return {
    repo: {
      listQueued: vi.fn(async () => queued),
      resolve: vi.fn(async (id: string, ipa: string | null, failed: boolean) => {
        resolved.push({ id, ipa, failed });
      }),
    },
    resolved,
  };
}

const chat = (reply: string): ChatClient => ({ complete: vi.fn(async () => reply) });

describe("runBackfill", () => {
  it("fills IPA from the dictionary tier and stores it done", async () => {
    const { repo: r, resolved } = repo([row({ sourceText: "hola" })]);
    const summary = await runBackfill({
      repo: r,
      languageOf: async () => "es",
      pipeline: { chat: null },
    });
    expect(summary).toEqual({ processed: 1, filled: 1, failed: 0 });
    expect(resolved[0]).toEqual({ id: "n1:back", ipa: "ˈola", failed: false });
  });

  it("uses the LLM tier on a dict miss", async () => {
    const { repo: r, resolved } = repo([row({ sourceText: "murciélago" })]);
    const summary = await runBackfill({
      repo: r,
      languageOf: async () => "es",
      pipeline: { chat: chat("/muɾˈθjelaɣo/") },
    });
    expect(summary.filled).toBe(1);
    expect(resolved[0].ipa).toBe("muɾˈθjelaɣo");
  });

  it("records a failure for retry when the LLM errors", async () => {
    const failing: ChatClient = { complete: vi.fn().mockRejectedValue(new Error("x")) };
    const { repo: r, resolved } = repo([row({ sourceText: "zzz" })]);
    const summary = await runBackfill({
      repo: r,
      languageOf: async () => "es",
      pipeline: { chat: failing },
    });
    expect(summary).toEqual({ processed: 1, filled: 0, failed: 1 });
    expect(resolved[0]).toEqual({ id: "n1:back", ipa: null, failed: true });
  });

  it("clears a row whose note was deleted (done, no IPA)", async () => {
    const { repo: r, resolved } = repo([row({})]);
    await runBackfill({ repo: r, languageOf: async () => null, pipeline: { chat: null } });
    expect(resolved[0]).toEqual({ id: "n1:back", ipa: null, failed: false });
  });

  it("respects the batch size", async () => {
    const { repo: r } = repo([]);
    await runBackfill({ repo: r, languageOf: async () => "es", pipeline: { chat: null }, batchSize: 5 });
    expect(r.listQueued).toHaveBeenCalledWith(5);
  });
});
