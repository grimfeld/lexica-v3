import { useState } from "react";
import type { Candidate, ExtractResult } from "./extract";

/*
 * Text-extraction panel (ADR-0007). The user pastes text or picks a .txt/.md
 * file; the AI proposes candidate Notes. Candidates render UNSELECTED — the
 * load-bearing north-star rule is the default state: nothing is added unless
 * the user explicitly checks it and confirms. The runner, file reader, and
 * note creator are injected so this is testable without AI/Tauri.
 */

export interface ExtractDialogProps {
  /** Run extraction on a document; returns candidates or an error. */
  onExtract: (doc: string) => Promise<ExtractResult>;
  /** Open a file and return its text, or null if cancelled. */
  onPickFile: () => Promise<string | null>;
  /** Create the accepted candidates as Notes. */
  onAccept: (accepted: Candidate[]) => Promise<void>;
  /** Provider doing the work, for the hint line. */
  providerLabel: string;
}

export function ExtractDialog({
  onExtract,
  onPickFile,
  onAccept,
  providerLabel,
}: ExtractDialogProps) {
  const [doc, setDoc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  // Selection is index-based; starts EMPTY (everything unselected).
  const [selected, setSelected] = useState<Set<number>>(new Set());

  async function pickFile() {
    const text = await onPickFile();
    if (text !== null) setDoc(text);
  }

  async function extract() {
    setBusy(true);
    setError(null);
    setCandidates(null);
    setSelected(new Set());
    try {
      const result = await onExtract(doc);
      if (result.ok && result.candidates) {
        setCandidates(result.candidates);
      } else {
        setError(result.error ?? "Couldn't extract anything.");
      }
    } finally {
      setBusy(false);
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function accept() {
    if (!candidates) return;
    const picked = candidates.filter((_, i) => selected.has(i));
    if (picked.length === 0) return;
    setBusy(true);
    try {
      await onAccept(picked);
      setCandidates(null);
      setSelected(new Set());
      setDoc("");
      setError(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3">
      <span className="text-sm font-medium">Extract from a document</span>
      <p className="text-xs text-[var(--color-ink-muted)]">
        Paste text or open a .txt/.md file you're studying. {providerLabel} proposes
        cards — none are added until you check them.
      </p>

      <textarea
        aria-label="Document text"
        placeholder="Paste a passage you're studying…"
        value={doc}
        onChange={(e) => setDoc(e.target.value)}
        rows={5}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
      />

      <div className="flex gap-2">
        <button
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
          onClick={pickFile}
          disabled={busy}
        >
          Open file…
        </button>
        <button
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
          onClick={extract}
          disabled={busy || doc.trim() === ""}
        >
          {busy ? "Reading…" : "Find cards"}
        </button>
      </div>

      {error && <p className="text-xs text-[var(--color-miss)]">{error}</p>}

      {candidates && candidates.length === 0 && (
        <p className="text-xs text-[var(--color-ink-muted)]">No cards found in that text.</p>
      )}

      {candidates && candidates.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[var(--color-ink-muted)]">
            {candidates.length} found · select the ones to add
          </span>
          <ul className="flex flex-col gap-1">
            {candidates.map((c, i) => (
              <li key={i}>
                <label className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`candidate ${i + 1}`}
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-1"
                  />
                  <span className="flex flex-col">
                    <span className="text-xs uppercase text-[var(--color-ink-muted)]">{c.type}</span>
                    <span>{summarizeCandidate(c)}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button
            className="self-start rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[var(--color-accent-ink)] disabled:opacity-50"
            onClick={accept}
            disabled={busy || selected.size === 0}
          >
            Add {selected.size} {selected.size === 1 ? "note" : "notes"}
          </button>
        </div>
      )}
    </div>
  );
}

/** A short preview of a candidate's content (its filled field values). */
function summarizeCandidate(c: Candidate): string {
  const parts = Object.values(c.fields)
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .slice(0, 2);
  return parts.join(" — ") || "(empty)";
}
