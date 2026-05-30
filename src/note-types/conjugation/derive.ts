import type { DerivedCard, FieldValues } from "../contract";

/*
 * Conjugation: a verb and a tense x person grid. One Card per FILLED cell, so a
 * partially-filled table only quizzes what the user entered. sliceKey =
 * "tense/person" — stable, so editing one cell never disturbs the others
 * (ADR-0009). Empty cells produce no Card.
 *
 * TENSES/PERSONS are the canonical axes the authoring grid offers; the stored
 * table may contain any subset.
 */

export const TENSES = ["present", "past", "future", "conditional", "subjunctive"];
export const PERSONS = ["je", "tu", "il", "nous", "vous", "ils"];

export interface ConjugationRender {
  verb: string;
  tense: string;
  person: string;
  answer: string;
  notes: string;
}

type Grid = Record<string, Record<string, string>>;

export function deriveConjugationCards(fields: FieldValues): DerivedCard[] {
  const verb = typeof fields.verb === "string" ? fields.verb : "";
  const notes = typeof fields.notes === "string" ? fields.notes : "";
  const table = (fields.table ?? {}) as Grid;

  const cards: DerivedCard[] = [];

  for (const tense of Object.keys(table)) {
    const row = table[tense];
    if (typeof row !== "object" || row === null) continue;
    for (const person of Object.keys(row)) {
      const answer = row[person];
      if (typeof answer !== "string" || answer === "") continue; // skip empty cells
      cards.push({
        sliceKey: `${tense}/${person}`,
        render: { verb, tense, person, answer, notes } satisfies ConjugationRender,
      });
    }
  }

  return cards;
}
