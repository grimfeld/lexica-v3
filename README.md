# Lexica

A spaced-repetition flashcard app for language learning. You source the
material from your own real-world encounters with the language; the app only
helps you retain it. It never decides what you learn — see `CONTEXT.md` and
`docs/adr/` for the principles behind it.

## Stack

- **Shell:** Tauri (web-first, exportable)
- **Frontend:** React + TypeScript, Vite
- **Styling:** Tailwind v4 + shadcn/ui, design tokens in `src/index.css`
  (see `docs/DESIGN-SYSTEM.md`)
- **Routing:** TanStack Router · **Server state:** TanStack Query ·
  **Session state:** Zustand
- **Local DB:** SQLite via the Tauri SQL plugin, schema with Drizzle
  (`src/db/schema.ts`); migrations in `src-tauri/migrations`
- **Scheduling:** `ts-fsrs`
- **Sync:** hand-rolled last-write-wins (ADR-0010)
- **Testing:** Vitest + Testing Library + Playwright (see `docs/TESTING.md`)

## Develop

Prerequisites: Node + pnpm, and Rust (for the native shell).

```sh
pnpm install
pnpm dev          # web layer only, in the browser at :5173
pnpm tauri dev    # native desktop app (requires Rust)
pnpm test         # unit/component tests
pnpm e2e          # Playwright e2e
pnpm db:generate  # regenerate SQL migration after editing src/db/schema.ts
```

## Docs

- `CONTEXT.md` — domain glossary
- `docs/adr/` — architecture decision records
- `docs/TICKETS.md` — build backlog (mirrored as GitHub issues)
- `docs/DESIGN-SYSTEM.md` — visual design tokens
- `docs/TESTING.md` — testing strategy
