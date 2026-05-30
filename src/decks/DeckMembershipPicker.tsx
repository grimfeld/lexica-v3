/*
 * Toggles a Note's membership across Decks. Used both from the Notes-list
 * (multi-select context) and inside the Note editor (Q-decision: both). A Note
 * may belong to several Decks, so this is a set of checkboxes, not a single
 * choice.
 */

export interface DeckMembershipPickerProps {
  decks: { id: string; name: string }[];
  /** Deck ids the note currently belongs to. */
  memberOf: Set<string>;
  onToggle: (deckId: string, member: boolean) => void;
}

export function DeckMembershipPicker({ decks, memberOf, onToggle }: DeckMembershipPickerProps) {
  if (decks.length === 0) {
    return <p className="text-sm text-[var(--color-ink-muted)]">No decks yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {decks.map((d) => {
        const member = memberOf.has(d.id);
        return (
          <li key={d.id}>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={member}
                onChange={() => onToggle(d.id, !member)}
              />
              <span>{d.name}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
