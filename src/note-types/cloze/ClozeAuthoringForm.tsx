import { useRef } from "react";
import type { AuthoringFormProps } from "../contract";
import { wrapSelectionAsBlank } from "./mark-blank";

/**
 * Cloze authoring form: a sentence textarea plus "Mark blank", which wraps the
 * current text selection in {{ }} (the "select text -> mark blank" interaction).
 */
export function ClozeAuthoringForm({ value, onChange }: AuthoringFormProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const text = typeof value.text === "string" ? value.text : "";
  const notes = typeof value.notes === "string" ? value.notes : "";

  function markBlank() {
    const el = ref.current;
    if (!el) return;
    const next = wrapSelectionAsBlank(text, el.selectionStart, el.selectionEnd);
    if (next !== text) onChange({ ...value, text: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-ink-muted)]">Sentence</span>
        <textarea
          ref={ref}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-[var(--font-content)]"
          rows={3}
          value={text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
      </label>

      <button
        type="button"
        className="self-start rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1 text-sm"
        onClick={markBlank}
      >
        Mark blank
      </button>

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
