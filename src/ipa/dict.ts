/*
 * The dictionary tier of the Pronunciation pipeline (ADR-0002): a small,
 * exact-match seed map consulted before the LLM fallback. It is intentionally
 * tiny for MVP — a real pronunciation dictionary can replace this behind the
 * same lookup() contract later. Keys are lower-cased, whitespace-trimmed words
 * per language id.
 */

const SEED: Record<string, Record<string, string>> = {
  es: {
    hola: "ˈola",
    gato: "ˈɡato",
    perro: "ˈpero",
    gracias: "ˈɡɾaθjas",
    agua: "ˈaɣwa",
  },
  fr: {
    bonjour: "bɔ̃ʒuʁ",
    chat: "ʃa",
    chien: "ʃjɛ̃",
    merci: "mɛʁsi",
    eau: "o",
  },
};

/** Exact dictionary lookup; null on miss (caller falls back to the LLM). */
export function dictLookup(languageId: string, text: string): string | null {
  const word = text.trim().toLowerCase();
  return SEED[languageId]?.[word] ?? null;
}
