/*
 * Retention-oriented stats only (ADR-0005). Describes the user's *knowledge* —
 * never their app attendance. No streaks, no time-in-app, no goals.
 *
 * Derived from per-Card FSRS state. ts-fsrs State: 0 New, 1 Learning, 2 Review,
 * 3 Relearning. A "mature" card is one in Review state. Retention rate is a
 * recall-success proxy: 1 - totalLapses/totalReps over cards that have actually
 * been reviewed.
 */

const STATE_REVIEW = 2;
const STATE_NEW = 0;

export interface CardStat {
  state: number;
  reps: number;
  lapses: number;
}

export interface RetentionStats {
  totalCards: number;
  newCards: number;
  matureCards: number;
  /** 0..1 recall-success proxy, or null if nothing reviewed yet. */
  retentionRate: number | null;
}

export function computeRetentionStats(cards: CardStat[]): RetentionStats {
  let newCards = 0;
  let matureCards = 0;
  let totalReps = 0;
  let totalLapses = 0;

  for (const c of cards) {
    if (c.state === STATE_NEW) newCards++;
    if (c.state === STATE_REVIEW) matureCards++;
    if (c.reps > 0) {
      totalReps += c.reps;
      totalLapses += c.lapses;
    }
  }

  return {
    totalCards: cards.length,
    newCards,
    matureCards,
    retentionRate: totalReps > 0 ? 1 - totalLapses / totalReps : null,
  };
}
