import { useState } from "react";

/*
 * Export / import buttons for local Storage Mode (Settings). The actual file
 * read/write and DB work are injected so this stays testable without Tauri.
 */

export interface BackupControlsProps {
  /** Returns true if a backup was written, false if cancelled. */
  onExport: () => Promise<boolean>;
  /** Returns an outcome message, or null if cancelled. */
  onImport: () => Promise<{ ok: boolean; error?: string } | null>;
}

export function BackupControls({ onExport, onImport }: BackupControlsProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function doExport() {
    setBusy(true);
    try {
      const saved = await onExport();
      setStatus(saved ? "Backup saved." : null);
    } finally {
      setBusy(false);
    }
  }

  async function doImport() {
    setBusy(true);
    try {
      const result = await onImport();
      if (result === null) setStatus(null);
      else setStatus(result.ok ? "Backup imported." : `Import failed: ${result.error}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 disabled:opacity-50"
          onClick={doExport}
          disabled={busy}
        >
          Export backup
        </button>
        <button
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 disabled:opacity-50"
          onClick={doImport}
          disabled={busy}
        >
          Import backup
        </button>
      </div>
      {status && <p className="text-sm text-[var(--color-ink-muted)]">{status}</p>}
    </div>
  );
}
