# CLAUDE.md

Orientation for a fresh session. Read this first, then the linked docs.

## What Lexica is

A spaced-repetition flashcard app for language learning. **The user sources all
material from their own real-world encounters; the app only helps retain it.**
The app never originates learning content — no suggestions, no curated decks, no
auto-added cards. This north star governs every decision; check new work against
it.

## The one principle that resolves most design questions

> AI and automation do the **labor**; the user decides the **content**.

Deriving cards, generating pronunciation, extracting candidates from a document
— all fine, because the user supplied the source and confirms the result.
Suggesting *what to learn* — never. When unsure whether a feature crosses the
line, the test is the **default state**: proposals the user opts into are fine;
content added by default is not. (See ADR-0007.)

## Read these before working

- `CONTEXT.md` — the domain glossary. Use these exact terms. Note, Note Type,
  Card, Review, Deck, Language, Pronunciation, Storage Mode, BYOK, TTS Cache,
  Retention. Don't invent synonyms.
- `docs/adr/0001`–`0011` — the binding decisions and *why*. Don't relitigate or
  "fix" a documented deviation without cause; the rationale is in the ADR.
- `docs/TICKETS.md` — the build backlog (mirrored as GitHub issues #1–23).
- `docs/DESIGN-SYSTEM.md` — visual tokens. Calm/editorial, paper + ink +
  terracotta, muted, minimal motion.
- `docs/TESTING.md` — risk-tiered test strategy.

## Core domain model (one-liner)

`Language` (top-level partition) → `Note` (typed, user-authored, rich) →
`Card` (app-derived prompt, **holds the FSRS state**) → `Review`. `Deck` groups
Notes (many-to-many). A **Note Type** is a code-defined, self-contained module
owning **all** its UI: fields · ipaFields · `deriveCards` · review renderer ·
authoring form (ADR-0003).

## Stack

Tauri · React 19 + TS · Vite · TanStack Router (file-based) + Query · Zustand
(session state) · Tailwind v4 + shadcn/ui · SQLite (Tauri SQL plugin) + Drizzle
· `ts-fsrs` · hand-rolled LWW sync (ADR-0010). Cloud later: PocketBase +
Cloudflare Workers + Stripe (ADR-0006).

## Commands

```sh
pnpm dev          # web layer in browser :5173 (no Rust needed)
pnpm tauri dev    # native desktop app — REQUIRES Rust toolchain
pnpm test         # Vitest (unit/component)
pnpm e2e          # Playwright
pnpm lint
pnpm db:generate  # regenerate SQL migration after editing src/db/schema.ts
```

## Conventions

- **Package manager: pnpm.** Not npm/yarn.
- **DB schema is the source of truth in `src/db/schema.ts`.** After editing,
  run `pnpm db:generate`, then embed the new migration in `src-tauri/src/lib.rs`
  (the SQL plugin applies migrations by `include_str!`).
- **Every synced table carries the sync columns** (`updatedAt`, `dirty`,
  `deletedAt` tombstone) — ADR-0010. New tables that sync must too.
- **Cards carry stable identity** `(noteId + sliceKey)` so Note edits diff
  cleanly without nuking FSRS history — ADR-0009. Don't regenerate Cards by
  delete-all-recreate.
- **TDD the data-loss/correctness landmines** (FSRS, card derivation, the
  ADR-0009 edit-diff, the LWW reconciler). Test-after elsewhere.
- **No engagement mechanics.** No streaks, daily goals, guilt counts, or
  escalating notifications — ADR-0005. Don't add them "to help."
- **Two layouts, one core** (ADR-0011): desktop = sidebar authoring station
  (lands on Notes list); mobile = bottom-nav review companion (lands on review).
- TanStack Router route files export a `Route` const beside the component — the
  eslint `react-refresh` override allows it; that's intentional.

## Current state

T1 (scaffold) done on branch `scaffold/t1-project-setup`, PR #24. Web layer
verified (tsc/test/lint/build green). **Native `tauri dev` not yet run** —
needs Rust installed locally. Storybook deferred (initializer errored on this
registry/Vite combo; wire manually later). Next up: T2 (Note Type module
contract), the interface everything hangs off.

## Gotchas seen this session

- Rust/cargo may not be on PATH; the Bash tool and Windows PATH can disagree —
  check both (`pnpm tauri` needs cargo).
- Something external touched the working dir mid-session (a docs file vanished
  once). Everything is committed + pushed, so rely on git, not just disk.
