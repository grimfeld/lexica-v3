import { useState } from "react";

/*
 * Per-changed-card reset prompt (ADR-0009). When a Note edit changes a Card's
 * content, only the user knows whether it was a typo fix (memory still valid ->
 * keep) or a substantive change (history stale -> reset). Nothing resets
 * silently. Bulk "reset all / keep all" for big edits (e.g. a conjugation table).
 */

export interface ResetCardsDialogProps {
  /** sliceKeys of the cards whose content changed. */
  changed: string[];
  /** Optional human label per slice for display. */
  labelFor?: (sliceKey: string) => string;
  /** Resolve with the set of sliceKeys to reset. */
  onResolve: (resetKeys: Set<string>) => void;
}

export function ResetCardsDialog({ changed, labelFor, onResolve }: ResetCardsDialogProps) {
  const [reset, setReset] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setReset((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex flex-col gap-4" role="dialog" aria-label="Reset review progress?">
      <div>
        <h3 className="text-lg">Some cards changed</h3>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Reset review progress for the cards whose answer meaningfully changed.
          Leave a typo fix unchecked to keep its history.
        </p>
      </div>

      <div className="flex gap-3 text-sm">
        <button className="underline" onClick={() => setReset(new Set(changed))}>
          Reset all
        </button>
        <button className="underline" onClick={() => setReset(new Set())}>
          Keep all
        </button>
      </div>

      <ul className="flex flex-col gap-1">
        {changed.map((key) => (
          <li key={key}>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={reset.has(key)}
                onChange={() => toggle(key)}
              />
              <span>{labelFor ? labelFor(key) : key}</span>
            </label>
          </li>
        ))}
      </ul>

      <button
        className="self-start rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[var(--color-accent-ink)]"
        onClick={() => onResolve(reset)}
      >
        Save changes
      </button>
    </div>
  );
}
