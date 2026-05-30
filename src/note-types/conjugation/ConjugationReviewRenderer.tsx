import type { ReviewRendererProps } from "../contract";
import type { ConjugationRender } from "./derive";

/**
 * Conjugation review renderer. Prompts "verb — tense, person"; on reveal shows
 * the conjugated form (the cell) plus IPA. The verb is target language, so IPA
 * applies to the answer form.
 */
export function ConjugationReviewRenderer({ render, revealed, ipa }: ReviewRendererProps) {
  const r = render as ConjugationRender;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex flex-col items-center gap-1">
        <p className="font-[var(--font-content)] text-3xl text-[var(--color-ink)]">
          {r.verb}
        </p>
        <p className="text-sm uppercase tracking-wide text-[var(--color-ink-muted)]">
          {r.tense} · {r.person}
        </p>
      </div>

      {revealed && (
        <div className="flex flex-col items-center gap-2 border-t border-[var(--color-border)] pt-4">
          <p className="font-[var(--font-content)] text-2xl text-[var(--color-ink)]">
            {r.answer}
          </p>
          {ipa && (
            <p className="font-[var(--font-ipa)] text-[var(--color-ink-muted)]">[{ipa}]</p>
          )}
          {r.notes && (
            <p className="text-sm text-[var(--color-ink-muted)]">{r.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
