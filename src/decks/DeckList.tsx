import { useState } from "react";

/*
 * Deck list — the user's groupings for the active Language. Create / rename /
 * delete and launch a Deck-scoped review. No auto-filing, no suggested decks
 * (CONTEXT.md / ADR-0005).
 */

export interface DeckSummary {
  id: string;
  name: string;
  noteCount: number;
}

export interface DeckListProps {
  decks: DeckSummary[];
  onCreate: (name: string) => void;
  onRename: (deckId: string, name: string) => void;
  onDelete: (deckId: string) => void;
  onReview: (deckId: string) => void;
}

export function DeckList({ decks, onCreate, onRename, onDelete, onReview }: DeckListProps) {
  const [newName, setNewName] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (name) {
            onCreate(name);
            setNewName("");
          }
        }}
      >
        <input
          aria-label="New deck name"
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          placeholder="New deck…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[var(--color-accent-ink)]"
        >
          Create
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {decks.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          >
            <div className="flex flex-col">
              <span>{d.name}</span>
              <span className="text-sm text-[var(--color-ink-muted)]">
                {d.noteCount} {d.noteCount === 1 ? "note" : "notes"}
              </span>
            </div>
            <div className="flex gap-2 text-sm">
              <button className="text-[var(--color-accent)]" onClick={() => onReview(d.id)}>
                Review
              </button>
              <button
                onClick={() => {
                  const name = prompt("Rename deck", d.name);
                  if (name && name.trim()) onRename(d.id, name.trim());
                }}
              >
                Rename
              </button>
              <button className="text-[var(--color-miss)]" onClick={() => onDelete(d.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
