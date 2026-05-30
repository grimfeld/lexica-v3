/*
 * Builds a review session queue from due Cards, applying the sibling throttle
 * (Q8 / ADR-0008-card-state): Cards derived from the same Note should not
 * surface back-to-back. The throttle only reorders — it never drops a due Card.
 * When one Note dominates the remaining pool, adjacency is unavoidable and
 * allowed.
 */

export interface QueueCard {
  id: string;
  noteId: string;
  due: Date;
}

export function buildSessionQueue(cards: QueueCard[], now: Date): QueueCard[] {
  const due = cards.filter((c) => c.due.getTime() <= now.getTime());

  // Group remaining by note; greedily emit, each step preferring the note with
  // the most cards left that isn't the note we just emitted.
  const remaining = new Map<string, QueueCard[]>();
  for (const c of due) {
    const list = remaining.get(c.noteId) ?? [];
    list.push(c);
    remaining.set(c.noteId, list);
  }

  const out: QueueCard[] = [];
  let lastNote: string | null = null;

  while (out.length < due.length) {
    // Candidate notes that still have cards, excluding the last note if possible.
    const notesLeft = [...remaining.entries()].filter(([, v]) => v.length > 0);
    const eligible = notesLeft.filter(([note]) => note !== lastNote);
    const pickFrom = eligible.length > 0 ? eligible : notesLeft;

    // Pick the note with the most cards remaining (spreads the dominant note).
    pickFrom.sort((a, b) => b[1].length - a[1].length);
    const [note, list] = pickFrom[0];

    out.push(list.shift()!);
    lastNote = note;
  }

  return out;
}
