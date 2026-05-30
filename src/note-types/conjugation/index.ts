import type { NoteTypeModule } from "../contract";
import { deriveConjugationCards, TENSES, PERSONS } from "./derive";
import { ConjugationReviewRenderer } from "./ConjugationReviewRenderer";
import { ConjugationAuthoringForm } from "./ConjugationAuthoringForm";

/** Conjugation: a verb and a tense x person grid. One Card per filled cell. */
export const conjugationNoteType: NoteTypeModule = {
  id: "conjugation",
  name: "Conjugation",
  fields: [
    { key: "verb", label: "Verb", kind: "text", required: true, ipa: true },
    {
      key: "table",
      label: "Conjugation",
      kind: "table",
      rows: TENSES,
      cols: PERSONS,
    },
    { key: "notes", label: "Notes", kind: "longtext" },
  ],
  deriveCards: deriveConjugationCards,
  ReviewRenderer: ConjugationReviewRenderer,
  AuthoringForm: ConjugationAuthoringForm,
};

export { deriveConjugationCards, TENSES, PERSONS } from "./derive";
export type { ConjugationRender } from "./derive";
