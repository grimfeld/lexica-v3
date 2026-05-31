import { useState } from "react";

/*
 * Cloud Storage Mode settings (ADR-0006/0010). Entirely opt-in — a local user
 * ignores this and loses nothing. Lets the user point at a PocketBase instance,
 * sign in / up, and run a manual sync. All actions are injected so this tests
 * without PocketBase. Sync is manual here; automatic triggers can come later.
 */

export interface CloudSettingsProps {
  configuredUrl: string | null;
  signedInEmail: string | null;
  onConfigure: (url: string) => Promise<void> | void;
  onSignIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onSignUp: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onSignOut: () => void;
  onSync: () => Promise<{ ok: boolean; error?: string }>;
}

export function CloudSettings(props: CloudSettingsProps) {
  const [url, setUrl] = useState(props.configuredUrl ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const signedIn = props.signedInEmail !== null;

  async function withBusy(fn: () => Promise<{ ok: boolean; error?: string } | void>, okMsg: string) {
    setBusy(true);
    setStatus(null);
    try {
      const r = await fn();
      if (r && !r.ok) setStatus(r.error ?? "Something went wrong.");
      else setStatus(okMsg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--color-ink-muted)]">
        Optional. Sync your notes, cards, and review state across devices through a
        PocketBase server. Stay local and skip this — nothing here is required.
      </p>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-ink-muted)]">Server URL</span>
        <div className="flex gap-2">
          <input
            aria-label="PocketBase URL"
            placeholder="https://your-pocketbase.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
          />
          <button
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
            onClick={() => withBusy(async () => props.onConfigure(url), "Server set.")}
            disabled={busy || url.trim() === ""}
          >
            Use
          </button>
        </div>
      </label>

      {props.configuredUrl &&
        (signedIn ? (
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2">
            <span className="text-sm">Signed in as {props.signedInEmail}</span>
            <button className="text-sm underline" onClick={props.onSignOut} disabled={busy}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              aria-label="Email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
            />
            <input
              aria-label="Password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3 py-2"
            />
            <div className="flex gap-2">
              <button
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
                onClick={() => withBusy(() => props.onSignIn(email, password), "Signed in.")}
                disabled={busy || !email || !password}
              >
                Sign in
              </button>
              <button
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 disabled:opacity-50"
                onClick={() => withBusy(() => props.onSignUp(email, password), "Account created.")}
                disabled={busy || !email || !password}
              >
                Create account
              </button>
            </div>
          </div>
        ))}

      {signedIn && (
        <button
          className="self-start rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[var(--color-accent-ink)] disabled:opacity-50"
          onClick={() => withBusy(() => props.onSync(), "Synced.")}
          disabled={busy}
        >
          Sync now
        </button>
      )}

      {status && <p className="text-xs text-[var(--color-ink-muted)]">{status}</p>}
    </div>
  );
}
