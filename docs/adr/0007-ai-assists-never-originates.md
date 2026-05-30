# AI assists, never originates

The dividing line for every AI feature: AI does the tedious labor, the user
decides the content. AI may scaffold or extract from material the user has
already chosen; it may never decide what the user should learn.

The MVP AI features, all on the correct side of this line:

- **Authoring assist** — the user supplies a seed (a word/phrase they
  encountered); AI fills the typed Note's fields. The user edits and confirms.
- **Text extraction** — the user supplies a document (PDF/txt they are
  studying); AI extracts candidate Notes. Candidates default **unselected**;
  nothing is added unless the user explicitly accepts it. The document is itself
  user-sourced material, so this fits "the user sources from real-world
  encounters" — the document is the encounter.
- **TTS** — spoken audio of a Note's content, a pronunciation aid.

The load-bearing rule is the **default state**: extraction candidates and
assisted fields are proposals the user opts into, never content added by
default. This ADR is the precedent for where the AI / north-star line sits for
all future AI features.
