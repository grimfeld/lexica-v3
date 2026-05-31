import { describe, it, expect, vi } from "vitest";
import { resolveSpeech } from "./speak";
import { inMemoryGlobalCache } from "./global-cache";
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

const client = (audio: CachedAudio): TtsClient => ({ synthesize: vi.fn(async () => audio) });

describe("resolveSpeech — global cache tier", () => {
  it("serves from the global cache on a local miss and seeds the local cache", async () => {
    const local = cache();
    // Pre-populate the global cache under the real key by generating it once.
    const seedGlobal = inMemoryGlobalCache();
    const c = client(AUDIO);
    await resolveSpeech("es", "hola", { cache: cache(), client: c, global: seedGlobal });

    const r = await resolveSpeech("es", "hola", { cache: local, client: null, global: seedGlobal });
    expect(r.ok).toBe(true);
    expect(r.source).toBe("global");
    // local cache now seeded
    expect(local.put).toHaveBeenCalledOnce();
  });

  it("synthesizes on a miss in both tiers and populates both", async () => {
    const local = cache();
    const global = inMemoryGlobalCache();
    const putSpy = vi.spyOn(global, "put");
    const c = client(AUDIO);
    const r = await resolveSpeech("es", "nuevo", { cache: local, client: c, global });
    expect(r.source).toBe("synth");
    expect(local.put).toHaveBeenCalledOnce();
    expect(putSpy).toHaveBeenCalledOnce();
  });

  it("local hit short-circuits before the global cache", async () => {
    const local = cache();
    // seed local under the real key
    const c = client(AUDIO);
    await resolveSpeech("es", "hi", { cache: local, client: c });
    const global = inMemoryGlobalCache();
    const getSpy = vi.spyOn(global, "get");
    const r = await resolveSpeech("es", "hi", { cache: local, client: null, global });
    expect(r.source).toBe("local");
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("ignores the global pool when not opted in (global null)", async () => {
    const local = cache();
    const c = client(AUDIO);
    const r = await resolveSpeech("es", "x", { cache: local, client: c, global: null });
    expect(r.source).toBe("synth");
  });

  it("a failed global contribution does not break playback", async () => {
    const local = cache();
    const failingGlobal = {
      get: vi.fn(async () => null),
      put: vi.fn(async () => {
        throw new Error("pb down");
      }),
    };
    const r = await resolveSpeech("es", "y", { cache: local, client: client(AUDIO), global: failingGlobal });
    expect(r.ok).toBe(true);
    expect(r.source).toBe("synth");
  });
});
