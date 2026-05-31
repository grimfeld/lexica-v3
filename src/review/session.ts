/*
 * Pure review-session state machine. The shell (ReviewSession.tsx) renders this
 * and persists grades; keeping the transitions pure makes the core loop
 * testable without React. Open-ended: the session simply walks the queue until
 * exhausted (no streaks, no goals — ADR-0005).
 */

export interface ReviewItem {
  cardId: string;
  noteId: string;
  typeId: string;
  /** The type's derived render payload, consumed by its ReviewRenderer. */
  render: unknown;
  /** IPA aid for this card's target text, if available (display-only). */
  ipa: string | null;
  /** Target-language text to speak (TTS), if the note has a speakable field. */
  speakText?: string | null;
}

export interface SessionState {
  items: ReviewItem[];
  index: number;
  revealed: boolean;
  current: ReviewItem | null;
  completed: number;
  total: number;
  done: boolean;
}

function at(items: ReviewItem[], index: number): SessionState {
  const done = index >= items.length;
  return {
    items,
    index,
    revealed: false,
    current: done ? null : items[index],
    completed: index,
    total: items.length,
    done,
  };
}

export function createSession(items: ReviewItem[]): SessionState {
  return at(items, 0);
}

export function reveal(state: SessionState): SessionState {
  if (state.done) return state;
  return { ...state, revealed: true };
}

/** Grade the current card (binary) and advance. `onGrade` persists the grade. */
export function gradeAndAdvance(
  state: SessionState,
  pass: boolean,
  onGrade: (cardId: string, pass: boolean) => void,
): SessionState {
  if (!state.current) return state;
  onGrade(state.current.cardId, pass);
  return at(state.items, state.index + 1);
}
