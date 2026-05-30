import type { NoteTypeModule } from "../contract";
import { deriveClozeCards } from "./derive";
import { ClozeReviewRenderer } from "./ClozeReviewRenderer";
import { ClozeAuthoringForm } from "./ClozeAuthoringForm";

/** Cloze (Sentence): a sentence with one or more {{blanked}} words. (ADR-0003) */
export const clozeNoteType: NoteTypeModule = {
  id: "cloze",
  name: "Sentence (cloze)",
  fields: [
    { key: "text", label: "Sentence", kind: "longtext", required: true, ipa: true },
    { key: "notes", label: "Notes", kind: "longtext" },
  ],
  deriveCards: deriveClozeCards,
  ReviewRenderer: ClozeReviewRenderer,
  AuthoringForm: ClozeAuthoringForm,
};

export { deriveClozeCards } from "./derive";
export type { ClozeRender } from "./derive";
