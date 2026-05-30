import type { ReviewRendererProps } from "../contract";
import type { ClozeRender } from "./derive";

/**
 * Cloze review renderer. The whole sentence is target language, so the prompt
 * (with one blank masked) is IPA-eligible; the answer reveals the masked word.
 */
export function ClozeReviewRenderer({ render, revealed, ipa }: ReviewRendererProps) {
  const r = render as ClozeRender;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-[var(--font-content)] text-2xl text-[var(--color-ink)]">
        {r.prompt}
      </p>

      {revealed && (
        <div className="flex flex-col items-center gap-2 border-t border-[var(--color-border)] pt-4">
          <p className="text-xl text-[var(--color-ink)]">{r.answer}</p>
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
