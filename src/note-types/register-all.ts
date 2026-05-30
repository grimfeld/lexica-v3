import { registerNoteType } from "./registry";
import { vocabNoteType } from "./vocab";
import { clozeNoteType } from "./cloze";
import { conjugationNoteType } from "./conjugation";

/** Registers every built-in Note Type. Called once at app startup. */
export function registerAllNoteTypes(): void {
  registerNoteType(vocabNoteType);
  registerNoteType(clozeNoteType);
  registerNoteType(conjugationNoteType);
}
