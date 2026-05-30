import type { DueCard } from "../review/assemble";

/**
 * Restrict a pool of due Cards to those belonging to a Deck's Notes. The result
 * feeds the normal assemble -> buildSessionQueue pipeline, so a Deck session is
 * just the ordinary review flow over a filtered card set.
 */
export function dueCardsForDeck(
  allDue: DueCard[],
  noteIdsInDeck: string[],
): DueCard[] {
  const inDeck = new Set(noteIdsInDeck);
  return allDue.filter((c) => inDeck.has(c.noteId));
}
