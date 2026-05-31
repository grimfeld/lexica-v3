import { useState } from "react";
import type { FieldValues } from "../note-types/contract";
import type { AssistResult } from "./authoring-assist";

/*
 * The authoring-assist panel shown above a Note's authoring form. The user
 * enters a seed and runs the AI fill; on success the proposed fields are handed
 * up to populate the form (the user then edits and confirms with the normal
 * Save button — this panel never persists). ADR-0007: assist proposes, the user
 * decides.
 *
 * The runner is injected so this component tests without network or a key.
 */

export interface AuthoringAssistProps {
  /** Run the assist for a seed; returns proposed fields or an error. */
  onAssist: (seed: string) => Promise<AssistResult>;
  /** Apply accepted fields into the form above. */
  onFill: (fields: FieldValues) => void;
  /** Which provider will be used, for the hint line (e.g. "Anthropic"). */
  providerLabel: string;
}

export function AuthoringAssist({ onAssist, onFill, providerLabel }: AuthoringAssistProps) {
  const [seed, setSeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const result = await onAssist(seed);
      if (result.ok && result.fields) {
        onFill(result.fields);
        setSeed("");
      } else {
        setError(result.error ?? "Couldn't generate fields.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3">
      <span className="text-sm font-medium">Fill with AI</span>
      <p className="text-xs text-[var(--color-ink-muted)]">
        Enter a word or phrase you encountered. {providerLabel} drafts the fields;
        you review and edit before saving — nothing is added on its own.
      </p>
      <div className="flex gap-2">
        <input
          aria-label="Seed word or phrase"
          placeholder="e.g. hola"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && seed.trim() !== "" && !busy) void run();
          }}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
        />
        <button
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
          onClick={run}
          disabled={busy || seed.trim() === ""}
        >
          {busy ? "Drafting…" : "Suggest fields"}
        </button>
      </div>
      {error && <p className="text-xs text-[var(--color-miss)]">{error}</p>}
    </div>
  );
}
