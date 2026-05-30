import type { ReviewRendererProps } from "../contract";
import type { VocabRender } from "./derive";

/**
 * Vocab review renderer (the type-specific region of the review shell, ADR-0003).
 * Prompt-top, answer revealed below. IPA shows on reveal only and only when the
 * prompt side is the target language (ADR-0002 — display-only aid).
 */
export function VocabReviewRenderer({ render, revealed, ipa }: ReviewRendererProps) {
  const r = render as VocabRender;
  const showIpa = revealed && r.promptIsTarget && ipa;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-[var(--font-content)] text-4xl text-[var(--color-ink)]">
        {r.prompt}
      </p>

      {revealed && (
        <div className="flex flex-col items-center gap-2 border-t border-[var(--color-border)] pt-4">
          <p className="text-2xl text-[var(--color-ink)]">{r.answer}</p>
          {showIpa && (
            <p className="font-[var(--font-ipa)] text-[var(--color-ink-muted)]">
              [{ipa}]
            </p>
          )}
          {r.notes && (
            <p className="text-sm text-[var(--color-ink-muted)]">{r.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
