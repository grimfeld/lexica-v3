import { useState } from "react";
import type { ProviderInfo } from "./providers";

/*
 * BYOK key management for Settings. One row per provider: enter a key, save,
 * clear, and optionally test it. Presentational — all storage and validation is
 * injected so it unit-tests without Tauri or the network. Stored key VALUES are
 * never read back into the UI (only presence), so a key can't be exfiltrated by
 * inspecting the form.
 */

export interface ByokSettingsProps {
  providers: ProviderInfo[];
  /** Provider ids that currently have a stored key. */
  keyedIds: string[];
  /** Persist a key for a provider (empty string clears). */
  onSave: (providerId: string, key: string) => Promise<void>;
  onClear: (providerId: string) => Promise<void>;
  /** Verify a freshly entered key against the provider; true = accepted. */
  onTest: (providerId: string, key: string) => Promise<boolean>;
}

export function ByokSettings(props: ByokSettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-ink-muted)]">
        Your keys are stored encrypted on this device only. They are never synced
        to the cloud, never included in a backup, and are sent only directly to
        the provider you entered them for.
      </p>
      {props.providers.map((p) => (
        <ProviderRow
          key={p.id}
          provider={p}
          hasKey={props.keyedIds.includes(p.id)}
          onSave={props.onSave}
          onClear={props.onClear}
          onTest={props.onTest}
        />
      ))}
    </div>
  );
}

function ProviderRow({
  provider,
  hasKey,
  onSave,
  onClear,
  onTest,
}: {
  provider: ProviderInfo;
  hasKey: boolean;
  onSave: ByokSettingsProps["onSave"];
  onClear: ByokSettingsProps["onClear"];
  onTest: ByokSettingsProps["onTest"];
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // `hasKey` is the source of truth (the parent re-queries after save/clear);
  // we don't mirror it into local state, so no prop/state drift.
  const stored = hasKey;

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      await onSave(provider.id, value);
      setValue("");
      setStatus("Saved.");
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setBusy(true);
    setStatus(null);
    try {
      await onClear(provider.id);
      setValue("");
      setStatus("Removed.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setStatus(null);
    try {
      const ok = await onTest(provider.id, value);
      setStatus(ok ? "Key works." : "Key was rejected.");
    } catch {
      setStatus("Couldn't reach the provider.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">{provider.label}</span>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {stored ? "Key stored" : "No key"}
        </span>
      </div>
      <p className="text-xs text-[var(--color-ink-muted)]">{provider.usedFor}</p>
      <div className="mt-1 flex gap-2">
        <input
          type="password"
          autoComplete="off"
          aria-label={`${provider.label} API key`}
          placeholder={stored ? "Enter a new key to replace" : "Paste API key"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
        />
        <button
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
          onClick={save}
          disabled={busy || value.trim() === ""}
        >
          Save
        </button>
        <button
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
          onClick={test}
          disabled={busy || value.trim() === ""}
        >
          Test
        </button>
        <button
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
          onClick={clear}
          disabled={busy || !stored}
        >
          Clear
        </button>
      </div>
      <div className="flex items-center justify-between">
        {status ? (
          <span className="text-xs text-[var(--color-ink-muted)]">{status}</span>
        ) : (
          <span />
        )}
        <a
          href={provider.keysUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[var(--color-accent)] underline"
        >
          Get a key
        </a>
      </div>
    </div>
  );
}
