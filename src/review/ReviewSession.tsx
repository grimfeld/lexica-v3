import { useEffect, useState } from "react";
import { getNoteType } from "../note-types";
import { IpaHelper } from "../ipa/IpaHelper";
import { SpeakButton } from "../tts/SpeakButton";
import {
  createSession,
  reveal,
  gradeAndAdvance,
  type ReviewItem,
  type SessionState,
} from "./session";

/*
 * The review session shell (screen C, ADR-0004/0005/0011). A calm shell:
 * prompt-top, answer revealed below via the card's type ReviewRenderer; subtle
 * progress bar; binary Miss/Got. Keyboard on desktop: space reveals, 1/j = Miss,
 * 2/k = Got. No streaks, no goal, no guilt count.
 */

export interface ReviewSessionProps {
  items: ReviewItem[];
  /** Persist a grade (e.g. repo.gradeCard). */
  onGrade: (cardId: string, pass: boolean) => void;
  /** Called once when the queue is exhausted. */
  onDone?: () => void;
  /** Speak target text (TTS); omitted when no key is configured. */
  onSpeak?: (text: string) => Promise<{ ok: boolean; error?: string }>;
}

export function ReviewSession({ items, onGrade, onDone, onSpeak }: ReviewSessionProps) {
  const [state, setState] = useState<SessionState>(() => createSession(items));

  const doReveal = () => setState((s) => reveal(s));
  const doGrade = (pass: boolean) =>
    setState((s) => (s.revealed ? gradeAndAdvance(s, pass, onGrade) : s));

  useEffect(() => {
    if (state.done) onDone?.();
  }, [state.done, onDone]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (state.done) return;
      if (!state.revealed && (e.code === "Space" || e.key === "Enter")) {
        e.preventDefault();
        doReveal();
      } else if (state.revealed) {
        if (e.key === "1" || e.key === "j") doGrade(false);
        if (e.key === "2" || e.key === "k") doGrade(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.revealed, state.done]);

  if (state.done) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <h2 className="text-2xl">Done for now.</h2>
        <p className="text-[var(--color-ink-muted)]">
          {state.total === 0 ? "Nothing ready to review." : "Come back whenever."}
        </p>
      </div>
    );
  }

  const item = state.current!;
  const Renderer = getNoteType(item.typeId).ReviewRenderer;
  const progress = state.total ? state.completed / state.total : 0;

  return (
    <div className="flex min-h-full flex-col">
      {/* subtle progress bar — position, not pressure */}
      <div className="h-0.5 w-full bg-[var(--color-border)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <Renderer render={item.render} revealed={state.revealed} ipa={item.ipa} />
        {state.revealed && onSpeak && item.speakText && (
          <SpeakButton onSpeak={() => onSpeak(item.speakText!)} />
        )}
        {state.revealed && item.ipa && <IpaHelper />}
      </div>

      <div className="flex justify-center gap-3 p-6">
        {!state.revealed ? (
          <button
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 py-2 text-[var(--color-accent-ink)]"
            onClick={doReveal}
          >
            Show
          </button>
        ) : (
          <>
            <button
              className="rounded-[var(--radius-md)] border border-[var(--color-miss)] px-6 py-2 text-[var(--color-miss)]"
              onClick={() => doGrade(false)}
            >
              Miss
            </button>
            <button
              className="rounded-[var(--radius-md)] border border-[var(--color-got)] px-6 py-2 text-[var(--color-got)]"
              onClick={() => doGrade(true)}
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
}
