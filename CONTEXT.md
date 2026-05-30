# Lexica

A spaced-repetition flashcard app for language learning. The user sources all
material from their own real-world encounters with the language; the app only
helps retain it. The app never originates learning material — no suggestions,
no auto-generated cards, no curated decks. The user keeps control over what
they learn.

## Language

**Language**:
A target language the user is studying (e.g. Spanish). The top-level partition:
every Note, Deck, session, and stat belongs to exactly one Language. The user
may study several Languages at once and switches the active one in the UI; only
the active Language's content is shown. The native/meaning side of a Note is
free text the system does not track — there is no "language pair", only the
target Language.

**Note**:
The stored, rich unit the user authors — a piece of vocabulary or grammar the
user encountered and chose to capture. Holds everything about the item (e.g.
all tenses of a verb, an idiom with its gloss). Authored by the user; the app
never originates a Note's content. Can be paused so it stops being reviewed.

**Note Type**:
The shape of a Note (e.g. Vocab, Sentence, Conjugation), defined in code by the
developer. Declares the Note's fields, which fields bear Pronunciation, and the
rule for deriving Cards. Users cannot define types.

**Card**:
A single review prompt the app derives automatically from a Note, according to
the Note's Type. One Note yields many Cards (e.g. one Card per tense). The user
never authors Cards directly — deriving them is redundant work the app handles
so the user can focus on the Note.

**Storage Mode**:
The user's choice of where their content lives. **Local** — on-device, free, no
account, with manual export/import to any cloud drive for backup. **Cloud** —
PocketBase-backed, paywalled, auto-synced across devices. Independent of whether
AI features are available.

**BYOK** (Bring Your Own Key):
The user supplying their own AI provider API key. Enables all AI features for
free in any Storage Mode; calls go directly from the client to the provider.
Contrasted with app-provided AI keys, which are paywalled and server-side only.

**TTS Cache**:
Generated speech audio, keyed by (normalized text + Language) — voice and model
are fixed app-wide per Language, so they are not part of the key. **Local** — on
device, private, but re-pays the provider per device. **Global** — ownerless
entries in PocketBase shared across users; free to opt into, lower cost. Cache
participation is independent of card Storage Mode: a local-card user may opt
into the global TTS Cache alone.

**Pronunciation**:
An IPA transcription attached to a word-bearing Note. A display-only aid shown
to help the user — never tested, since the app has no voice recognition and
typing IPA is impractical. IPA is chosen because it is language-agnostic and
the user only reads it, never types it.

**Deck**:
A user-created grouping of Notes used to run topic-related sessions. The user
creates Decks and chooses which Notes belong; the app never auto-files. A Note
may belong to several Decks. A Deck's session draws from the Cards derived from
its Notes.

**Review**:
A scheduled encounter with a Card where the user tests their recall. Spaced-
repetition state (due date, difficulty, history) lives on the Card, so each
derived prompt is scheduled independently. Cards derived from the same Note are
throttled so siblings do not surface back-to-back in one session.

**Retention**:
The purpose of the app — keeping already-encountered material from being
forgotten. Contrasted with acquisition (meeting new material), which happens
outside the app.
_Avoid_: Learning (too broad — conflates acquisition with retention)
