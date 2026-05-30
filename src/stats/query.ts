import type { SqlExecutor } from "../notes/repository";
import { computeRetentionStats, type CardStat, type RetentionStats } from "./compute";

/*
 * Reads per-Card FSRS state for a Language (or a Deck within it) and computes
 * retention stats. The fsrs column is JSON; we pull just the fields the stats
 * need (state/reps/lapses).
 */

interface FsrsJsonRow {
  fsrs: string;
}

function toCardStat(row: FsrsJsonRow): CardStat {
  const f = JSON.parse(row.fsrs) as { state?: number; reps?: number; lapses?: number };
  return { state: f.state ?? 0, reps: f.reps ?? 0, lapses: f.lapses ?? 0 };
}

export function createStatsQuery(db: SqlExecutor) {
  async function forLanguage(languageId: string): Promise<RetentionStats> {
    const rows = await db.select<FsrsJsonRow>(
      `SELECT c.fsrs FROM cards c
       JOIN notes n ON n.id = c.note_id
       WHERE n.language_id = ? AND c.deleted_at IS NULL AND n.deleted_at IS NULL`,
      [languageId],
    );
    return computeRetentionStats(rows.map(toCardStat));
  }

  async function forDeck(deckId: string): Promise<RetentionStats> {
    const rows = await db.select<FsrsJsonRow>(
      `SELECT c.fsrs FROM cards c
       JOIN deck_notes dn ON dn.note_id = c.note_id
       WHERE dn.deck_id = ? AND dn.deleted_at IS NULL AND c.deleted_at IS NULL`,
      [deckId],
    );
    return computeRetentionStats(rows.map(toCardStat));
  }

  return { forLanguage, forDeck };
}
