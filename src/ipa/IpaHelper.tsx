import { useState } from "react";

/*
 * A small IPA reading aid (ADR-0002 mandates a helper for users unfamiliar with
 * the phonetic alphabet). Collapsed by default so it never competes with the
 * card; expands to a compact reference of common symbols with familiar example
 * words. Reference-only — IPA is never tested.
 */

const SYMBOLS: { sym: string; example: string }[] = [
  { sym: "ˈ", example: "stress on the next syllable" },
  { sym: "ə", example: "the a in 'about'" },
  { sym: "ʃ", example: "the sh in 'ship'" },
  { sym: "ʒ", example: "the s in 'measure'" },
  { sym: "tʃ", example: "the ch in 'church'" },
  { sym: "θ", example: "the th in 'thin'" },
  { sym: "ð", example: "the th in 'this'" },
  { sym: "ŋ", example: "the ng in 'sing'" },
  { sym: "ɲ", example: "the ñ in 'señor'" },
  { sym: "ʁ", example: "the French r in 'rue'" },
  { sym: "ɛ̃", example: "the nasal vowel in French 'vin'" },
  { sym: "ɣ", example: "a soft g, Spanish 'agua'" },
];

export function IpaHelper() {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-xs text-[var(--color-ink-muted)]">
      <button
        className="underline"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Hide IPA guide" : "What do these symbols mean?"}
      </button>
      {open && (
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {SYMBOLS.map((s) => (
            <div key={s.sym} className="flex gap-2">
              <dt className="font-medium text-[var(--color-ink)]">{s.sym}</dt>
              <dd>{s.example}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
