# Lexica — Design System

Calm / utilitarian / editorial. The app recedes; the language content is the
hero. Realizes the "tool, not driver" north star visually: no dopamine-bait
color, no celebratory motion, no gamified chrome.

Implemented as CSS custom properties wired into the Tailwind theme and shadcn/ui
token vars — single source of truth, themeable (light/dark).

## Typography (two tiers)

- **Chrome / UI tier**
  - **Newsreader** (OFL) — display & headings. Editorial, screen-optimized,
    optical sizes. Carries character: headings, revealed-answer meaning, empty
    states, prose.
  - **Inter** — UI body, labels, tables, buttons, dense surfaces. Legible at
    small sizes; classic serif-display / sans-body editorial pairing.
- **Content / target-language tier** (renders foreign material)
  - **Per-Language content font**, owned by the Language (mirrors per-Language
    voice, ADR-0008). Defaults to **Noto Serif / Noto Sans** where uncurated,
    for broad Unicode/script coverage.
  - **IPA**: **Charis SIL** (or Noto Sans) — designed for full phonetic glyph
    coverage. The target-language word is the visual focus: large, clean.

"Minimal" applies to chrome, never to content rendering — multi-script, IPA,
cloze blanks, and conjugation tables get full typographic care.

## Color (muted, paper + ink + terracotta)

Avoid saturated colors throughout. Warm-neutral, paper-like.

- **Background**: light beige, imitating paper (warm off-white). Dark mode: warm
  near-black, not pure black.
- **Text/ink**: high-contrast warm dark, not #000.
- **Accent**: **terracotta** — used sparingly, **for neutral primary actions
  only** (Start, primary buttons, links). NOT used for review feedback.
- **Review semantics** (desaturated, kept calm even at the grading moment, and
  deliberately separated from the terracotta accent so "action" never reads as
  "wrong"):
  - **Miss**: muted cool rose / burgundy (distinct from terracotta).
  - **Got**: muted sage / olive.

## Spacing & density

- 4px base scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 ...
- Two density defaults from the same tokens [ADR-0011]:
  - **Desktop authoring station**: denser (tables, bulk entry).
  - **Mobile review companion**: airier; touch targets ≥ 44px.

## Radius

- Subtle, consistent: `radius-md ≈ 6–8px`. Not pill-rounded (too playful), not
  zero (too cold). One knob via shadcn's radius var.

## Motion (minimal)

- Functional only: answer reveal (~150–200ms ease), route fades.
- No spring/bounce, no celebratory animation on a correct grade (that is
  gamification, against ADR-0005).
- Respect `prefers-reduced-motion`.

## Dark mode

- Shipped in MVP. Both themes from one token set via CSS vars. Editorial dark:
  warm, paper-ink inverted, never pure black/white.
