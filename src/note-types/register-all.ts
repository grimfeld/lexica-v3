import { registerNoteType } from "./registry";
import { vocabNoteType } from "./vocab";
import { clozeNoteType } from "./cloze";

/**
 * Registers every built-in Note Type. Called once at app startup. New types
 * (Conjugation T8) are added here.
 */
export function registerAllNoteTypes(): void {
  registerNoteType(vocabNoteType);
  registerNoteType(clozeNoteType);
}
