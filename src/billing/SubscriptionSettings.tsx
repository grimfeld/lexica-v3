import { useState } from "react";

/*
 * Subscription panel (ADR-0006). Shows the user's current entitlement (mirrored
 * from Stripe via the webhook) and a Subscribe button that launches Checkout.
 * This unlocks the app-key AI path and cloud — BYOK never depends on it. Actions
 * injected for testability.
 */

export interface SubscriptionSettingsProps {
  /** Current entitlement, or null when signed out / unavailable. */
  active: boolean | null;
  /** Launch Stripe Checkout; returns false if unavailable. */
  onSubscribe: () => Promise<boolean>;
}

export function SubscriptionSettings({ active, onSubscribe }: SubscriptionSettingsProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (active === null) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        Sign in to manage a subscription. Bring-your-own-key AI works without one.
      </p>
    );
  }

  async function subscribe() {
    setBusy(true);
    setStatus(null);
    try {
      const ok = await onSubscribe();
      if (!ok) setStatus("Checkout isn't available yet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        Status:{" "}
        <span className={active ? "text-[var(--color-got)]" : "text-[var(--color-ink-muted)]"}>
          {active ? "Active" : "Not subscribed"}
        </span>
      </p>
      <p className="text-xs text-[var(--color-ink-muted)]">
        A subscription enables the app's hosted AI (no key needed) and cloud sync.
        Bring-your-own-key AI is always free and needs no subscription.
      </p>
      {!active && (
        <button
          className="self-start rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[var(--color-accent-ink)] disabled:opacity-50"
          onClick={subscribe}
          disabled={busy}
        >
          Subscribe
        </button>
      )}
      {status && <p className="text-xs text-[var(--color-ink-muted)]">{status}</p>}
    </div>
  );
}
