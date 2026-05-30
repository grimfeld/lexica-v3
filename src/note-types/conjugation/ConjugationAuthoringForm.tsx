import type { AuthoringFormProps } from "../contract";
import { TENSES, PERSONS } from "./derive";

type Grid = Record<string, Record<string, string>>;

/**
 * Conjugation authoring form: the verb, an editable tense x person grid, and
 * notes. Only filled cells become Cards (see derive), so the user fills as much
 * of the grid as they know.
 */
export function ConjugationAuthoringForm({ value, onChange }: AuthoringFormProps) {
  const verb = typeof value.verb === "string" ? value.verb : "";
  const notes = typeof value.notes === "string" ? value.notes : "";
  const table = (value.table ?? {}) as Grid;

  const cell = (tense: string, person: string) => table[tense]?.[person] ?? "";

  function setCell(tense: string, person: string, v: string) {
    const nextRow = { ...(table[tense] ?? {}), [person]: v };
    onChange({ ...value, table: { ...table, [tense]: nextRow } });
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-ink-muted)]">Verb</span>
        <input
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-[var(--font-content)]"
          value={verb}
          onChange={(e) => onChange({ ...value, verb: e.target.value })}
        />
      </label>

      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-1" />
              {PERSONS.map((p) => (
                <th key={p} className="p-1 font-normal text-[var(--color-ink-muted)]">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TENSES.map((tense) => (
              <tr key={tense}>
                <th className="p-1 text-right font-normal text-[var(--color-ink-muted)]">
                  {tense}
                </th>
                {PERSONS.map((person) => (
                  <td key={person} className="p-1">
                    <input
                      aria-label={`${tense} ${person}`}
                      className="w-24 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 font-[var(--font-content)]"
                      value={cell(tense, person)}
                      onChange={(e) => setCell(tense, person, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-ink-muted)]">Notes (optional)</span>
        <textarea
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          rows={2}
          value={notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </label>
    </div>
  );
}
