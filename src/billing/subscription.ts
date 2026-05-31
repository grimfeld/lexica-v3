/*
 * Client-side subscription access (ADR-0006). The client reads its mirrored
 * entitlement off the PocketBase user record, can start a Stripe Checkout, and
 * requests a short-lived access token (minted server-side) to pass to the AI
 * proxy (T21). All server touchpoints are injected so this tests without
 * PocketBase, Stripe, or a network.
 */

export interface SubscriptionPorts {
  /** Current entitlement mirrored on the signed-in user, or null if signed out. */
  readActive: () => Promise<boolean | null>;
  /** Begin Stripe Checkout; returns a URL to open (or null if unavailable). */
  startCheckout: () => Promise<string | null>;
  /** Fetch a fresh short-lived access token from the server. */
  fetchAccessToken: () => Promise<string | null>;
  /** Open a URL (the Stripe Checkout page) in the user's browser. */
  openUrl: (url: string) => void;
}

export function createSubscription(ports: SubscriptionPorts) {
  async function isActive(): Promise<boolean> {
    return (await ports.readActive()) === true;
  }

  /** Launch checkout; returns false if no URL came back (e.g. not signed in). */
  async function subscribe(): Promise<boolean> {
    const url = await ports.startCheckout();
    if (!url) return false;
    ports.openUrl(url);
    return true;
  }

  /** Get a token only if currently entitled; null otherwise (no point asking). */
  async function accessToken(): Promise<string | null> {
    if (!(await isActive())) return null;
    return ports.fetchAccessToken();
  }

  return { isActive, subscribe, accessToken };
}

export type Subscription = ReturnType<typeof createSubscription>;
