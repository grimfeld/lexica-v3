# Lexica — Testing Strategy

Risk-tiered. Rigor concentrates where bugs are silent and costly (data loss,
wrong scheduling); pragmatic test-after elsewhere; minimal E2E.

**Tooling:** Vitest (unit/integration) · React Testing Library (components) ·
Playwright (E2E) · Storybook 8 + Vitest addon (component isolation; stories run
as component tests, shared render setup with RTL).

## High-risk — TDD, exhaustive (test-first)

Silent failures here mean data loss or wrong learning.

- **FSRS scheduling** [T5] — grade → interval correctness, edge cases.
- **Card derivation** (`deriveCards` per type) [T3/7/8] — correct cards, stable
  identity keys.
- **Re-derivation diff on Note edit** [ADR-0009] — new / removed / unchanged /
  changed buckets. The first data-loss landmine; test exhaustively.
- **LWW sync reconciler** [ADR-0010] — conflict resolution, tombstones,
  last-review-wins for FSRS state. The second data-loss landmine.

These are pure functions → cheap, high-value. Write tests first.

## Medium-risk — test-after, solid coverage

- AI output validation against type schemas [T15/16] — invalid rejected/retried.
- Pronunciation backfill queue; TTS cache key/hit logic.
- Stripe webhook → status → JWT claim flow.
- Local DB layer (Drizzle queries); sync round-trip vs a test PocketBase.

## Lower-risk — pragmatic / visual

- **Component tests (RTL)**: review *shell* (reveal, grade, advance) and
  authoring shell behavior — not every renderer pixel.
- **Storybook**: every Note Type's review renderer + authoring form in isolation
  against fixture Notes (conjugation grid, cloze blank, multi-script, IPA). Each
  new type ships a story. Also the living design-system gallery (light/dark,
  palette, type, multi-script).

## E2E — handful of critical paths only (Playwright)

- author → review → grade
- extract (PDF) → accept candidates → Notes created
- cloud sync round-trip

Not comprehensive. No visual-regression suite for MVP (low ROI, solo build).

## Per-Note-Type definition of done

A new Note Type is not done until it has: derivation unit tests, a Storybook
story for its review renderer and authoring form, and (if it touches scheduling)
FSRS coverage.
