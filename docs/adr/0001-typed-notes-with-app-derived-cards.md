# Typed Notes with app-derived Cards

A Note has a type chosen at creation (e.g. Vocab, Sentence, Conjugation). The
app knows each type's structure and deterministically derives Cards from it
(e.g. Conjugation → one Card per tense). Cards are never authored by the user.

We chose this over a single free-text Note because automatic Card derivation
requires the app to understand a Note's structure — a shapeless blob cannot be
sliced reliably. We rejected user-marked derivation syntax (clunky, pushes
slicing back onto the user) and LLM parsing of free text (cost, offline,
reliability, and it puts the app in the position of deciding what is testable).

The cost is per-type rigidity, accepted because versatility comes from having
many types rather than one shapeless field. Note types must stay cheaply
expandable, since different languages will need different types.
