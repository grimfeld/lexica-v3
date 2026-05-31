import { mapStripeEvent, type StripeEventLike } from "./event-map";
import { makeClaims, signToken } from "./jwt";

/*
 * Host-agnostic server handlers (ADR-0006). These hold the flow; the actual host
 * — a PocketBase JS hook or a Cloudflare Worker route — supplies the request
 * plumbing and the dependencies (Stripe signature verification, the PocketBase
 * admin client, the secrets). Wired when T21 picks the host.
 *
 * Keeping the flow here (and pure where possible) means the entitlement and
 * token logic is tested independently of any deploy target.
 */

export interface WebhookDeps {
  /** Verify the Stripe signature and parse the event; throws/returns null if invalid. */
  verifyEvent: (rawBody: string, signature: string) => Promise<StripeEventLike | null>;
  /** Persist the entitlement flag on the PocketBase user. */
  setSubscriptionActive: (userId: string, active: boolean) => Promise<void>;
}

export interface WebhookResult {
  ok: boolean;
  applied?: { userId: string; active: boolean };
  error?: string;
}

/**
 * Handle a Stripe webhook: verify, map to an entitlement change, and persist it.
 * An unrelated or user-less event verifies fine but applies nothing. A bad
 * signature is rejected so forged calls can't grant access.
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  let event: StripeEventLike | null;
  try {
    event = await deps.verifyEvent(rawBody, signature);
  } catch {
    return { ok: false, error: "signature verification failed" };
  }
  if (!event) return { ok: false, error: "invalid event" };

  const update = mapStripeEvent(event);
  if (!update) return { ok: true }; // verified but not entitlement-affecting

  await deps.setSubscriptionActive(update.userId, update.active);
  return { ok: true, applied: update };
}

export interface IssueTokenDeps {
  /** The HS256 signing secret (shared with the Worker verifier, T21). */
  secret: string;
  nowSeconds: () => number;
}

/**
 * Mint a short-lived access token for a freshly authenticated user, stamping
 * their current entitlement. Called by the host on login (the PocketBase auth
 * hook per ADR-0006); the Worker later verifies it on the AI hot path.
 */
export async function issueAccessToken(
  userId: string,
  subscriptionActive: boolean,
  deps: IssueTokenDeps,
): Promise<string> {
  const claims = makeClaims(userId, subscriptionActive, deps.nowSeconds());
  return signToken(claims, deps.secret);
}
