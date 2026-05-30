import type { DerivedCard, FieldValues } from "../contract";

/** Render payload for a Cloze card. */
export interface ClozeRender {
  /** Sentence with the target blank masked, other blanks filled. */
  prompt: string;
  /** The masked word. */
  answer: string;
  notes: string;
}

interface Blank {
  index: number;
  answer: string;
}

const BLANK_RE = /\{\{(.+?)\}\}/g;
export const MASK = "[   ]";

/** Parse `{{word}}` markers, returning ordered blanks and the raw segments. */
export function parseCloze(text: string): { blanks: Blank[] } {
  const blanks: Blank[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  BLANK_RE.lastIndex = 0;
  while ((m = BLANK_RE.exec(text)) !== null) {
    blanks.push({ index: i++, answer: m[1] });
  }
  return { blanks };
}

/**
 * Render the sentence with the blank at `target` masked and all other blanks
 * filled with their answer.
 */
function renderWithMask(text: string, target: number): string {
  let i = 0;
  return text.replace(BLANK_RE, (_full, word: string) =>
    i++ === target ? MASK : word,
  );
}

/**
 * Cloze derives one Card per blank. sliceKey = "blank:N" by ordinal position,
 * so editing surrounding text keeps each blank's identity (ADR-0009). No cards
 * when there are no blanks. The whole sentence is target language -> IPA aid is
 * eligible (handled by the renderer).
 */
export function deriveClozeCards(fields: FieldValues): DerivedCard[] {
  const text = typeof fields.text === "string" ? fields.text : "";
  const notes = typeof fields.notes === "string" ? fields.notes : "";
  const { blanks } = parseCloze(text);

  return blanks.map((b) => ({
    sliceKey: `blank:${b.index}`,
    render: {
      prompt: renderWithMask(text, b.index),
      answer: b.answer,
      notes,
    } satisfies ClozeRender,
  }));
}
