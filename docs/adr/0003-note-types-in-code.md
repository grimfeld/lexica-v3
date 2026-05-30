# Note types defined in code, not data

Each Note type (Vocab, Sentence, Conjugation, ...) is a built-in definition
shipped in the app, sitting behind one uniform interface with four parts:

1. its **fields** (the authoring schema),
2. which fields bear **Pronunciation** (IPA),
3. a **`deriveCards(note)`** rule,
4. a **review renderer** — a React component that draws the prompt and the
   revealed answer for that type's Cards, and
5. an **authoring form** — a React component for creating/editing a Note of
   this type (e.g. a grid editor for Conjugation, "select text → mark blank"
   for Cloze, simple fields for Vocab).

A Note Type is thus a self-contained module owning all of its UI, in and out.
The generic review screen and authoring screen are shells that delegate the
type-specific region to the type's renderer/form. Adding a type is an isolated
code change plus a release: data + derivation + review renderer + authoring
form. Only the developer adds types; users cannot define their own.

We rejected data/config-defined types (a user- or community-definable type
engine) because that means building a Card-derivation mini-language up front —
a large subsystem — before we know which types real languages actually need.
The uniform interface keeps each type isolated, so types can later be lifted
into data without rearchitecting if genuine demand appears.

MVP ships a starter set: Vocab, Sentence (cloze), Conjugation.
