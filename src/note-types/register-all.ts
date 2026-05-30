import { registerNoteType } from "./registry";
import { vocabNoteType } from "./vocab";

/**
 * Registers every built-in Note Type. Called once at app startup. New types
 * (Cloze T7, Conjugation T8) are added here.
 */
export function registerAllNoteTypes(): void {
  registerNoteType(vocabNoteType);
}
