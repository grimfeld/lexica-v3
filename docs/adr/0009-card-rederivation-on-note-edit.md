# Card re-derivation on Note edit

Cards are derived from Notes and carry the FSRS state. Editing a Note re-derives
its Cards via a diff on stable Card identity — `(noteId + slice key)`, where the
slice key names the derived prompt (e.g. a conjugation cell, a direction). The
diff resolves each Card:

- **Unchanged** slice → keep the Card and its FSRS state, untouched.
- **New** slice → new Card, fresh FSRS state.
- **Removed** slice → drop the Card and its history.
- **Content-changed** slice → keep the Card, but **prompt the user** whether to
  reset its FSRS state. The user decides per changed Card; nothing resets
  silently. A bulk "reset all / keep all" is offered when many changed at once.

The user-prompt (rather than an automatic reset) is the deliberate choice: only
the user knows whether an edit was a typo fix (memory still valid) or a
substantive change to the fact under test (history now stale). It keeps the app
surfacing the labor while the user keeps control.

Stable Card identity is committed early because retrofitting it later would mean
migrating all existing FSRS state.
