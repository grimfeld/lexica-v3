import { describe, it, expect, vi } from "vitest";
import { resolveSpeech } from "./speak";
import type { TtsClient } from "./client";
import type { CachedAudio } from "./cache-repository";

const AUDIO: CachedAudio = { audioB64: "QUJD", mime: "audio/mpeg" };

function cache(initial: Record<string, CachedAudio> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    put: vi.fn(async (k: string, a: CachedAudio) => {
      store.set(k, a);
    }),
    store,
  };
}

const client = (audio: CachedAudio): TtsClient => ({
  synthesize: vi.fn(async () => audio),
});

describe("resolveSpeech", () => {
  it("returns cached audio without synthesizing", async () => {
    const c = client(AUDIO);
    // Seed the cache under the real key by first generating it.
    const seeded = cache();
    await resolveSpeech("es", "hola", { cache: seeded, client: c });
    c.synthesize = vi.fn(async () => AUDIO); // reset spy
    const r = await resolveSpeech("es", "hola", { cache: seeded, client: c });
    expect(r.ok).toBe(true);
    expect(r.fromCache).toBe(true);
    expect(c.synthesize).not.toHaveBeenCalled();
  });

  it("synthesizes and caches on a miss", async () => {
    const cc = cache();
    const c = client(AUDIO);
    const r = await resolveSpeech("es", "nuevo", { cache: cc, client: c });
    expect(r.ok).toBe(true);
    expect(r.fromCache).toBe(false);
    expect(r.audio).toEqual(AUDIO);
    expect(c.synthesize).toHaveBeenCalledOnce();
    expect(cc.put).toHaveBeenCalledOnce();
  });

  it("reuses the cache for whitespace/case variants (same key)", async () => {
    const cc = cache();
    const c = client(AUDIO);
    await resolveSpeech("es", "Hola", { cache: cc, client: c });
    const r = await resolveSpeech("es", "  hola ", { cache: cc, client: c });
    expect(r.fromCache).toBe(true);
    expect(c.synthesize).toHaveBeenCalledOnce(); // only the first one synthesized
  });

  it("errors (no synth) when no client is configured and it's a miss", async () => {
    const cc = cache();
    const r = await resolveSpeech("es", "x", { cache: cc, client: null });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ElevenLabs key/);
  });

  it("surfaces a synth error without caching", async () => {
    const cc = cache();
    const failing: TtsClient = { synthesize: vi.fn().mockRejectedValue(new Error("429")) };
    const r = await resolveSpeech("es", "x", { cache: cc, client: failing });
    expect(r.ok).toBe(false);
    expect(r.error).toContain("429");
    expect(cc.put).not.toHaveBeenCalled();
  });

  it("rejects empty text", async () => {
    const r = await resolveSpeech("es", "  ", { cache: cache(), client: client(AUDIO) });
    expect(r.ok).toBe(false);
  });
});
