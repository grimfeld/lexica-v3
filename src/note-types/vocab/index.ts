import type { NoteTypeModule } from "../contract";
import { deriveVocabCards } from "./derive";
import { VocabReviewRenderer } from "./VocabReviewRenderer";
import { VocabAuthoringForm } from "./VocabAuthoringForm";

/** Vocab: a target-language term, its meaning, optional notes. (ADR-0003) */
export const vocabNoteType: NoteTypeModule = {
  id: "vocab",
  name: "Vocabulary",
  fields: [
    { key: "term", label: "Term", kind: "text", required: true, ipa: true },
    { key: "meaning", label: "Meaning", kind: "text", required: true },
    { key: "notes", label: "Notes", kind: "longtext" },
  ],
  deriveCards: deriveVocabCards,
  ReviewRenderer: VocabReviewRenderer,
  AuthoringForm: VocabAuthoringForm,
};

export { deriveVocabCards } from "./derive";
export type { VocabRender } from "./derive";
