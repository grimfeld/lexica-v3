import type { DerivedCard } from "../note-types/contract";

/*
 * The ADR-0009 re-derivation diff. When a Note is edited, its Cards are
 * re-derived; this classifies each derived slice against the existing Cards by
 * stable sliceKey so FSRS history is never silently lost:
 *
 *   - new slice      -> insert (fresh FSRS state)
 *   - gone slice     -> remove (drop the Card and its history)
 *   - unchanged      -> keep   (FSRS state untouched)
 *   - content changed-> changed (the CALLER prompts the user per card whether
 *                                 to reset FSRS state; this function only
 *                                 classifies, it never decides the reset)
 *
 * Render payloads are compared structurally (deep equality on the derived
 * render). deriveCards is deterministic, so equal content => equal render.
 */

export interface ChangedCard {
  sliceKey: string;
  next: DerivedCard;
}

export interface CardDiffPlan {
  insert: DerivedCard[];
  remove: string[]; // sliceKeys
  keep: string[]; // sliceKeys, FSRS untouched
  changed: ChangedCard[];
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }
  const ak = Object.keys(a as object);
  const bk = Object.keys(b as object);
  if (ak.length !== bk.length) return false;
  return ak.every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

export function diffCards(
  oldCards: DerivedCard[],
  newCards: DerivedCard[],
): CardDiffPlan {
  const oldByKey = new Map(oldCards.map((c) => [c.sliceKey, c]));
  const newByKey = new Map(newCards.map((c) => [c.sliceKey, c]));

  const plan: CardDiffPlan = { insert: [], remove: [], keep: [], changed: [] };

  for (const next of newCards) {
    const prev = oldByKey.get(next.sliceKey);
    if (!prev) {
      plan.insert.push(next);
    } else if (deepEqual(prev.render, next.render)) {
      plan.keep.push(next.sliceKey);
    } else {
      plan.changed.push({ sliceKey: next.sliceKey, next });
    }
  }

  for (const prev of oldCards) {
    if (!newByKey.has(prev.sliceKey)) plan.remove.push(prev.sliceKey);
  }

  return plan;
}
