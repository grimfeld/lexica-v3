import type { DerivedCard, FieldValues } from "../contract";

/** Render payload for a Vocab card (consumed by VocabReviewRenderer). */
export interface VocabRender {
  prompt: string;
  answer: string;
  notes: string;
  /** True when the prompt side is the target language (eligible for IPA aid). */
  promptIsTarget: boolean;
}

/**
 * Vocab derives two Cards — both directions. Stable sliceKeys "fwd"/"rev" so
 * editing the term/meaning diffs cleanly without nuking FSRS history (ADR-0009).
 * No cards if either side is empty.
 */
export function deriveVocabCards(fields: FieldValues): DerivedCard[] {
  const term = typeof fields.term === "string" ? fields.term : "";
  const meaning = typeof fields.meaning === "string" ? fields.meaning : "";
  const notes = typeof fields.notes === "string" ? fields.notes : "";

  if (!term || !meaning) return [];

  return [
    {
      sliceKey: "fwd",
      render: { prompt: term, answer: meaning, notes, promptIsTarget: true } satisfies VocabRender,
    },
    {
      sliceKey: "rev",
      render: { prompt: meaning, answer: term, notes, promptIsTarget: false } satisfies VocabRender,
    },
  ];
}
