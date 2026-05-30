import {
  fsrs,
  createEmptyCard,
  Rating,
  type Card as FsrsCard,
  type FSRS,
} from "ts-fsrs";

/*
 * FSRS scheduling engine (ADR-0004). Per-Card state; binary pass/fail mapped to
 * Again/Good — every extra grade is review friction, so Hard/Easy are omitted.
 * Runs on default parameters and personalizes as history accumulates.
 *
 * `CardState` is the ts-fsrs Card. It is serialized to JSON in `cards.fsrs`.
 */

export type CardState = FsrsCard;

let scheduler: FSRS | null = null;
function getScheduler(): FSRS {
  if (!scheduler) scheduler = fsrs();
  return scheduler;
}

/** Fresh FSRS state for a newly derived Card — due immediately. */
export function newCardState(now: Date): CardState {
  return createEmptyCard(now);
}

/** Apply a binary grade. pass -> Good, fail -> Again. */
export function grade(state: CardState, pass: boolean, now: Date): CardState {
  const rating = pass ? Rating.Good : Rating.Again;
  return getScheduler().next(state, now, rating).card;
}

export function isDue(state: CardState, now: Date): boolean {
  return state.due.getTime() <= now.getTime();
}

// ---- Serialization --------------------------------------------------------

export function serializeState(state: CardState): string {
  return JSON.stringify(state);
}

export function deserializeState(json: string): CardState {
  const raw = JSON.parse(json) as Record<string, unknown>;
  // Dates survive JSON as ISO strings; rehydrate them.
  return {
    ...(raw as unknown as CardState),
    due: new Date(raw.due as string),
    last_review:
      raw.last_review != null ? new Date(raw.last_review as string) : undefined,
  };
}
