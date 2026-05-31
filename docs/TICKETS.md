# Lexica MVP — Build Tickets

Vertical slices, dependency-ordered. Each ships something usable. ADR refs in
brackets. A ticket is "done" when its acceptance criteria pass.

**Stack:** Tauri · React + TS · Tailwind · shadcn/ui · TanStack Router + Query ·
SQLite (Tauri SQL plugin) + Drizzle (local source of truth) · Zustand (session
state) · `ts-fsrs` · hand-rolled LWW sync [ADR-0010].

**Design:** see DESIGN-SYSTEM.md — Newsreader + Inter chrome, per-Language
content font, paper-beige + terracotta, muted rose/sage review, dark mode.

**Testing:** see TESTING.md — Vitest + RTL + Playwright + Storybook 8 (Vitest
addon). TDD the 4 high-risk logic areas; test-after elsewhere; minimal E2E.

**Two layouts** [ADR-0011]: desktop = sidebar authoring station (lands on Notes
list); mobile = bottom-nav review companion (lands on review dashboard). Shared
core, divergent component trees.

**Note Type = self-contained module** [ADR-0003], five parts: fields ·
ipaFields · deriveCards · review renderer · authoring form.

---

## Milestone 0 — Walking skeleton (local, no AI)

### T1 — Project scaffold (Tauri + React + TS)
Tauri shell, React/TS frontend, Tailwind + shadcn, TanStack Router, SQLite via
Tauri SQL plugin + Drizzle, Zustand. Test + design tooling.
- [ ] Tauri shell runs on desktop, loads web UI
- [ ] Local DB initialized with Drizzle migrations
- [ ] Sync-ready columns on synced tables: `updated_at`, `dirty`, tombstones [ADR-0010]
- [ ] Vitest + RTL + Playwright + Storybook 8 (Vitest addon) wired
- [ ] Design tokens as CSS vars → Tailwind + shadcn (light/dark); fonts loaded
- [ ] One smoke test + one story in CI
Depends on: —

### T2 — Note Type module contract [ADR-0001, 0003]
Self-contained Note Type module owning all its UI. Five parts: `fields`,
`ipaFields`, `deriveCards(note)`, review renderer (React), authoring form (React).
- [ ] `NoteType` interface with the five-part shape
- [ ] Type registry (add a type = register one module)
- [ ] Field schema machine-readable + validatable (AI targets it, T14/T15)
- [ ] Unit tests for the contract
Depends on: T1

### T3 — Vocab Note Type (full module)
- [ ] Vocab type registered; front/back + notes; IPA field declared
- [ ] `deriveCards` yields both directions as stable-identity Cards [ADR-0009]
- [ ] Review renderer (prompt-top / answer-reveal)
- [ ] Authoring form (simple fields)
- [ ] Tests cover derivation
Depends on: T2

### T4 — Note authoring shell (manual)
Shell that delegates to the active type's authoring form.
- [ ] Pick type → shell mounts type's form → save
- [ ] Pause toggle stops a Note's Cards from being reviewed
- [ ] Edit re-derives via diff [ADR-0009]: new=fresh, removed=drop,
      unchanged=keep, changed=prompt user per Card (+ bulk reset/keep)
Depends on: T3

### T5 — FSRS scheduling engine [ADR-0004, 0009]
- [ ] Integrate `ts-fsrs`; per-Card SR state (due, difficulty, history)
- [ ] Binary pass/fail → Again/Good
- [ ] Sibling throttle: no two Cards from one Note back-to-back
- [ ] Tests for grade → next-interval
Depends on: T3

### T6 — Review session shell [ADR-0004, 0005, 0011]
Shell: reveal toggle, binary grade, subtle progress bar, TTS chrome. Delegates
prompt/answer region to the Card's type review renderer.
- [ ] Open session → ready Cards, no guilt count
- [ ] Delegates render to type renderer (T3)
- [ ] IPA on reveal only; subtle bar; binary Miss/Got
- [ ] Desktop keyboard shortcuts (space=reveal, grade keys)
- [ ] Open-ended; stop anytime; no streaks/goals/notifications
Depends on: T5, T3

**Ships: working local SRS flashcard app.**

---

## Milestone 1 — More types + Decks + Stats + layouts

### T7 — Sentence (cloze) Note Type module
- [ ] Cloze type; `deriveCards` = one Card per blank, stable identity
- [ ] Review renderer (blank in-sentence)
- [ ] Authoring form ("select text → mark blank")
Depends on: T2, T4, T6

### T8 — Conjugation Note Type module
- [ ] Table type; one Card per filled cell; stable `tense/person` slice keys
- [ ] Review renderer (cell highlighted in mini-table)
- [ ] Authoring form (grid editor)
Depends on: T2, T4, T6

### T9 — Decks
- [ ] Create/rename/delete Deck; assign Notes (manual only), multi-membership
- [ ] Edit membership from Notes-list multi-select AND Note editor
- [ ] Deck-scoped session
Depends on: T6

### T10 — Multi-Language partition
- [ ] Create/switch active Language
- [ ] Notes/Decks/sessions/stats scoped to active Language
Depends on: T6

### T11 — Retention stats
- [ ] Retention rate, totals, per-Deck progress, neutral review-volume history
- [ ] No engagement stats [ADR-0005]
Depends on: T6, T9

### T12 — Two layouts (desktop sidebar / mobile bottom-nav) [ADR-0011]
- [ ] Desktop: sidebar, lands on Notes list (searchable/filterable, bulk actions)
- [ ] Mobile: bottom nav, lands on calm review dashboard
- [ ] Shared core hooks/stores; divergent trees
Depends on: T6, T9, T10, T11

### T13 — Local export / import
- [ ] Export all local data to a portable file
- [ ] Import restores it
Depends on: T4

**Ships: full local app — 3 types, decks, languages, stats, both layouts.**

---

## Milestone 2 — AI (BYOK, client-direct)

AI bound by type schemas; invalid output rejected/retried [Q20, ADR-0007].

### T14 — BYOK plumbing [ADR-0006]
- [x] Enter/clear key in settings; key only ever goes client → provider
      (Stronghold-encrypted vault, never synced / never in backup; per-provider
      key store + test-connection; in-memory fallback in browser dev)
Depends on: T1

### T15 — Authoring assist [ADR-0007]
- [x] User picks type + seed; AI fills fields; validated vs schema; retry on invalid
      (BYOK chat client, client-direct; bounded retry on malformed/invalid JSON)
- [x] Nothing saved without user confirm (assist only populates the form;
      existing Save path validates + persists; panel hidden without a chat key)
Depends on: T14, T4

### T16 — Text extraction [ADR-0007]
- [x] Import txt/md OR paste text → AI extracts candidates (AI picks type)
      (PDF parsing deferred; paste covers "copied from a PDF / web page")
- [x] Candidates default UNSELECTED; user opts in per card (selection starts
      empty; only checked candidates are accepted — enforced by test)
- [x] Accepted → valid type-shaped Notes created (each candidate type-bound +
      validateFields'd in the extractor before it can be offered)
Depends on: T14, T4

### T17 — Pronunciation pipeline [ADR-0002]
- [x] Dict lookup → LLM fallback; nullable IPA; async backfill (retry queue)
      (tiny seed dict + BYOK LLM fallback; pronunciations table, status-driven
      queue; backfill runs after note save + on app load; failures retried)
- [x] IPA display-only on reveal; never tested; IPA reading helper
      (stored IPA threaded to review renderers on reveal; collapsible IPA guide)
Depends on: T14, T4

### T18 — TTS + local cache [ADR-0008]
- [x] ElevenLabs; app-fixed voice per Language; key = hash(text + language)
      (voices config map; djb2 hash over normalized text; BYOK client-direct)
- [x] Local cache; warn re higher per-device cost (tts_cache table base64,
      migration v3; cache-first speak; per-device cost note in settings)
- [x] Play in review (on reveal) + authoring preview (in the shell)
Depends on: T14, T17

**Ships: full AI on BYOK, fully local-capable.**

---

## Milestone 3 — Cloud (PocketBase + Workers + Stripe)

### T19 — PocketBase storage + auth + sync [ADR-0006, 0010]
- [x] Optional sign up/in (local users skip) — PocketBase auth behind AuthApi;
      Cloud section in settings, entirely opt-in
- [x] Cloud Storage Mode syncs Notes/Cards/FSRS state (+ languages, decks,
      deck_notes, pronunciations); tts_cache/sync_state stay device-local
- [x] Hand-rolled LWW reconciler (isolated in src/sync/reconcile.ts, swappable);
      last-review-wins for FSRS via the card's `last_review`
- [x] Conflict policy per ADR-0010 (LWW by updated_at for content, tombstones,
      per-device watermark; ties favour the shared copy)
- Reconciler + engine + local store are pure and fully TDD'd (the data-loss
  landmine). Live PocketBase path needs a running instance + collections to
  verify end-to-end (rid/updated_at/deleted_at/data fields, users auth).
Depends on: T13

### T20 — Stripe + subscription status [ADR-0006]
- [x] Checkout for cloud + app-key paywall (client subscription module +
      Subscribe button; opens Stripe Checkout via opener plugin)
- [x] Webhook updates `subscriptionActive` in PocketBase (pure event->flag
      mapper + host-agnostic handler; bad signature rejected, unrelated events
      no-op)
- [x] Login issues short-lived JWT (~15 min) with `active` claim (HS256 over
      Web Crypto; sign + verify shared with the T21 Worker; TDD'd incl.
      tamper/expiry/wrong-secret)
- Pure logic (event-map, jwt, handlers, subscription) fully TDD'd. Live Stripe +
  PocketBase endpoints (/api/billing/checkout, /token, webhook host) are wired
  to stubs returning null until T21 picks the host — needs Stripe keys +
  webhook secret + a deployed endpoint to verify end-to-end.
Depends on: T19

### T21 — Cloudflare Worker AI proxy [ADR-0006]
- [x] Worker verifies JWT `active`, proxies to providers; app keys server-side only
      (worker/ project; gate = bearer + verifyToken + active claim; keys in
      Worker secrets, never shipped; chat/tts/billing routes)
- [x] App-key AI path available in any Storage Mode for subscribers (client
      transport picks BYOK-direct when a key exists, else app-key via Worker for
      active subscribers; proxyChatClient satisfies the same ChatClient iface)
- Gate, transport selection, and proxy contract are pure + TDD'd in src/ai.
  The Worker (worker/) is thin deploy glue reusing the shared, tested logic;
  it's NOT deployed — needs a Cloudflare account + secrets + live PB/Stripe.
Depends on: T20, T15–T18

### T22 — Global TTS cache [ADR-0008]
- [x] Opt into global cache (even as local-card user); free (localStorage toggle,
      independent of card Storage Mode; needs a configured PocketBase, not cloud
      card storage)
- [x] Ownerless entries: keyhash → audio, no user attached (`tts_global`
      collection: keyhash/audio_b64/mime, no user field)
- [x] Miss → generate + populate (speak tiers local → global → synth; a synth
      result populates both local + global; a global hit seeds local)
- Tier precedence + populate-both is pure + TDD'd in speak.ts. The live
  PocketBase global cache needs the collection created + a configured server to
  verify end-to-end.
Depends on: T18, T19

### T23 — Daily reminder [ADR-0005]
- [ ] Off by default; user-set hour; unconditional habit cue; no count/escalation
Depends on: T6

**Ships: cloud sync, paywalled AI, global cache, reminders — full MVP.**

---

## Dependency summary

```
T1 ─┬─ T2 ─ T3 ─┬─ T4 ─ T7,T8,T9,T10,T13
    │           └─ T5 ─ T6 ─┬─ T7,T8,T9,T10,T11,T23
    │                       └─ T12
    └─ T14 ─ T15,T16,T17 ─ T18
T13 ─ T19 ─ T20 ─ T21
              T19 ─ T22
```

## Cut lines (if scope must shrink)
- Drop T8 Conjugation → ship Vocab + Cloze only
- Drop T16 extraction → keep authoring-assist
- Defer all Milestone 3 → ship local-only + BYOK first
