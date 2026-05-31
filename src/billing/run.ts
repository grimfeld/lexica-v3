import { openUrl } from "@tauri-apps/plugin-opener";
import { pbInstance } from "../sync/run";
import { createSubscription, type Subscription } from "./subscription";

/*
 * Live subscription wiring (ADR-0006). Entitlement is read from the PocketBase
 * user record's mirrored `subscriptionActive` flag (set only by the verified
 * Stripe webhook). Checkout and token minting call server endpoints whose host
 * is finalized in T21; until then they return null, so the UI degrades to
 * "subscription unavailable" rather than breaking. BYOK never depends on any of
 * this — it's only the app-key paywall path.
 */

async function postJson<T>(path: string): Promise<T | null> {
  const pb = pbInstance();
  if (!pb || !pb.authStore.isValid) return null;
  try {
    const res = await fetch(`${pb.baseURL}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: pb.authStore.token,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const subscription: Subscription = createSubscription({
  readActive: async () => {
    const pb = pbInstance();
    if (!pb || !pb.authStore.isValid) return null;
    const rec = pb.authStore.record as { subscriptionActive?: boolean } | null;
    return rec?.subscriptionActive ?? false;
  },
  startCheckout: async () => {
    const r = await postJson<{ url: string }>("/api/billing/checkout");
    return r?.url ?? null;
  },
  fetchAccessToken: async () => {
    const r = await postJson<{ token: string }>("/api/billing/token");
    return r?.token ?? null;
  },
  openUrl: (url) => {
    void openUrl(url);
  },
});
