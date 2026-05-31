import { useState } from "react";

/*
 * A small speaker control for target-language text (ADR-0008). Presentational:
 * the actual cache-first synth + playback is injected via onSpeak, so it tests
 * without audio or a key. Disabled while a clip is being fetched/played; surfaces
 * an error inline (e.g. missing key, rate limit).
 */

export interface SpeakButtonProps {
  /** Resolve + play the audio; returns ok=false with an error to display. */
  onSpeak: () => Promise<{ ok: boolean; error?: string }>;
  label?: string;
}

export function SpeakButton({ onSpeak, label = "Play pronunciation" }: SpeakButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const r = await onSpeak();
      if (!r.ok) setError(r.error ?? "Couldn't play audio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label={label}
        onClick={go}
        disabled={busy}
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 py-1 text-sm disabled:opacity-50"
      >
        {busy ? "♪…" : "🔊"}
      </button>
      {error && <span className="text-xs text-[var(--color-miss)]">{error}</span>}
    </span>
  );
}
