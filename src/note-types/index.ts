/*
 * Note Type module system (ADR-0003). Concrete types (Vocab, Cloze,
 * Conjugation) register themselves here in later tickets (T3, T7, T8).
 */
export type {
  NoteTypeModule,
  FieldDescriptor,
  FieldKind,
  TextField,
  TableField,
  FieldValues,
  DerivedCard,
  ReviewRendererProps,
  AuthoringFormProps,
} from "./contract";
export { ipaFields } from "./contract";
export {
  registerNoteType,
  getNoteType,
  listNoteTypes,
} from "./registry";
export { validateFields } from "./validate";
export type { ValidationResult, FieldError } from "./validate";
