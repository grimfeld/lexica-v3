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
- [ ] User picks type + seed; AI fills fields; validated vs schema; retry on invalid
- [ ] Nothing saved without user confirm
Depends on: T14, T4

### T16 — Text extraction [ADR-0007]
- [ ] Import PDF/txt → AI extracts candidates (AI picks type)
- [ ] Candidates default UNSELECTED; user opts in per card
- [ ] Accepted → valid type-shaped Notes created
Depends on: T14, T4

### T17 — Pronunciation pipeline [ADR-0002]
- [ ] Dict lookup → LLM fallback; nullable IPA; async backfill (retry queue)
- [ ] IPA display-only on reveal; never tested; IPA reading helper
Depends on: T14, T4

### T18 — TTS + local cache [ADR-0008]
- [ ] ElevenLabs; app-fixed voice per Language; key = hash(text + language)
- [ ] Local cache; warn re higher per-device cost
Depends on: T14, T17

**Ships: full AI on BYOK, fully local-capable.**

---

## Milestone 3 — Cloud (PocketBase + Workers + Stripe)

### T19 — PocketBase storage + auth + sync [ADR-0006, 0010]
- [ ] Optional sign up/in (local users skip)
- [ ] Cloud Storage Mode syncs Notes/Cards/FSRS state
- [ ] Hand-rolled LWW reconciler (isolated, swappable); last-review-wins for FSRS
- [ ] Conflict policy per ADR-0010
Depends on: T13

### T20 — Stripe + subscription status [ADR-0006]
- [ ] Checkout for cloud + app-key paywall
- [ ] Webhook updates `subscriptionActive` in PocketBase
- [ ] Login issues short-lived JWT (~15 min) with `active` claim
Depends on: T19

### T21 — Cloudflare Worker AI proxy [ADR-0006]
- [ ] Worker verifies JWT `active`, proxies to providers; app keys server-side only
- [ ] App-key AI path available in any Storage Mode for subscribers
Depends on: T20, T15–T18

### T22 — Global TTS cache [ADR-0008]
- [ ] Opt into global cache (even as local-card user); free
- [ ] Ownerless entries: keyhash → audio, no user attached
- [ ] Miss → generate + populate
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
