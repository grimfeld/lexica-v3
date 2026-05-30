import type { AuthoringFormProps } from "../contract";

/**
 * Vocab authoring form (the type-specific region of the authoring shell). Simple
 * fields: the target-language term, its meaning (free text — the native side is
 * untracked), and optional notes.
 */
export function VocabAuthoringForm({ value, onChange }: AuthoringFormProps) {
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [key]: e.target.value });

  const str = (key: string) => (typeof value[key] === "string" ? (value[key] as string) : "");

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-ink-muted)]">Term</span>
        <input
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-[var(--font-content)]"
          value={str("term")}
          onChange={set("term")}
          autoFocus
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-ink-muted)]">Meaning</span>
        <input
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          value={str("meaning")}
          onChange={set("meaning")}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-ink-muted)]">Notes (optional)</span>
        <textarea
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          rows={2}
          value={str("notes")}
          onChange={set("notes")}
        />
      </label>
    </div>
  );
}
