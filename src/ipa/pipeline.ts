import type { ChatClient } from "../ai/chat";
import { dictLookup } from "./dict";

/*
 * The Pronunciation pipeline (ADR-0002): dictionary lookup first, LLM fallback
 * when the word is missing. There is NO user review step — a user who can't read
 * IPA can't validate it. IPA is nullable: if both tiers fail (e.g. no key or a
 * network error) we return null and the caller leaves the row to be retried.
 *
 * The dict and chat client are injected so the resolution precedence and the
 * null/failure handling unit-test without network. This is correctness-adjacent
 * (it's the one place the app originates content), so it's TDD'd.
 */

export type IpaSource = "dict" | "llm" | "none";

export interface IpaResolution {
  ipa: string | null;
  source: IpaSource;
  /** True when an attempt errored (vs. a clean "not found") — drives retry. */
  failed: boolean;
}

export interface PipelineDeps {
  lookup?: (languageId: string, text: string) => string | null;
  /** A chat client for the LLM tier, or null if no key is configured. */
  chat: ChatClient | null;
}

const IPA_LINE = /\/([^/]+)\/|\[([^\]]+)\]/; // capture /…/ or […] IPA notation

/** Pull a bare IPA string out of an LLM reply, tolerating slashes/brackets/prose. */
export function parseIpaReply(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const m = trimmed.match(IPA_LINE);
  if (m) return (m[1] ?? m[2]).trim();
  // No delimiters: accept only a short SINGLE token (no spaces) — a bare
  // transcription. Anything with spaces is prose ("I don't know") and rejected.
  const firstLine = trimmed.split("\n")[0].trim();
  if (firstLine.length > 0 && firstLine.length <= 40 && !/\s/.test(firstLine)) {
    return firstLine;
  }
  return null;
}

function ipaPrompt(languageId: string, text: string) {
  return {
    system:
      "You are an IPA transcription tool. Given a word or short phrase and its " +
      "language, reply with ONLY its broad IPA transcription between slashes, " +
      "e.g. /ˈola/. No prose, no explanation.",
    user: `Language: ${languageId}\nText: ${text}`,
  };
}

/**
 * Resolve IPA for one piece of target-language text. Dict hit wins; otherwise
 * the LLM tier runs if a client is available. Returns null IPA (failed=true) on
 * an LLM error so the backfill queue retries; failed=false with null IPA means
 * "genuinely no pronunciation available right now" (no client) — still retryable.
 */
export async function resolveIpa(
  languageId: string,
  text: string,
  deps: PipelineDeps,
): Promise<IpaResolution> {
  const source = text.trim();
  if (source === "") return { ipa: null, source: "none", failed: false };

  const lookup = deps.lookup ?? dictLookup;
  const hit = lookup(languageId, source);
  if (hit) return { ipa: hit, source: "dict", failed: false };

  if (!deps.chat) return { ipa: null, source: "none", failed: false };

  try {
    const raw = await deps.chat.complete(ipaPrompt(languageId, source));
    const ipa = parseIpaReply(raw);
    if (ipa) return { ipa, source: "llm", failed: false };
    return { ipa: null, source: "none", failed: true };
  } catch {
    return { ipa: null, source: "none", failed: true };
  }
}
