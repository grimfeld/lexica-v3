import { useState } from "react";

/*
 * Switches the active Language and adds new ones. Lives in the desktop sidebar
 * and the mobile nav (ADR-0011). Only the active Language's content is shown
 * elsewhere; this is the single place the partition is chosen.
 */

export interface LanguageSwitcherProps {
  languages: { id: string; name: string }[];
  activeId: string | null;
  onSwitch: (id: string) => void;
  onAdd: (name: string) => void;
}

export function LanguageSwitcher({ languages, activeId, onSwitch, onAdd }: LanguageSwitcherProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <select
        aria-label="Active language"
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
        value={activeId ?? ""}
        onChange={(e) => onSwitch(e.target.value)}
      >
        {languages.length === 0 && <option value="">No languages yet</option>}
        {languages.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      {adding ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (n) {
              onAdd(n);
              setName("");
              setAdding(false);
            }
          }}
        >
          <input
            aria-label="New language name"
            autoFocus
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm"
            placeholder="e.g. Spanish"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="text-sm text-[var(--color-accent)]">
            Add
          </button>
        </form>
      ) : (
        <button
          className="self-start text-sm text-[var(--color-ink-muted)]"
          onClick={() => setAdding(true)}
        >
          + Add language
        </button>
      )}
    </div>
  );
}
