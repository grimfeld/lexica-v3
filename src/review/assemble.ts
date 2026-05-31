import { getNoteType, ipaFields, type FieldValues } from "../note-types";
import type { ReviewItem } from "./session";

/*
 * Assembles ReviewItems from due Cards. The renderer needs each Card's render
 * payload, which is derived (not stored) — derivation is cheap and deterministic
 * (ADR-0003), so we re-derive and match by sliceKey. A due Card whose slice no
 * longer derives (e.g. mid-edit) is skipped.
 */

export interface DueCard {
  cardId: string;
  noteId: string;
  sliceKey: string;
  ipa: string | null;
}

export interface NoteSource {
  id: string;
  type: string;
  fields: FieldValues;
}

export function assembleReviewItems(
  dueCards: DueCard[],
  notes: Map<string, NoteSource>,
): ReviewItem[] {
  const items: ReviewItem[] = [];

  for (const due of dueCards) {
    const note = notes.get(due.noteId);
    if (!note) continue;
    const type = getNoteType(note.type);
    const derived = type.deriveCards(note.fields);
    const match = derived.find((d) => d.sliceKey === due.sliceKey);
    if (!match) continue; // slice no longer exists; skip

    // Speakable text = the note's primary IPA-bearing field (target language).
    const speakKey = ipaFields(type)[0];
    const speakVal = speakKey ? note.fields[speakKey] : undefined;

    items.push({
      cardId: due.cardId,
      noteId: due.noteId,
      typeId: note.type,
      render: match.render,
      ipa: due.ipa,
      speakText: typeof speakVal === "string" && speakVal ? speakVal : null,
    });
  }

  return items;
}
