/*
 * Maps a Stripe webhook event to the desired `subscriptionActive` state for a
 * user (ADR-0006). Stripe is the source of truth for payment; the webhook is the
 * ONLY thing that flips the mirrored flag in PocketBase — there is no live Stripe
 * call on the request path. This is the pure decision; the HTTP/signature wrapper
 * (handlers.ts) and the actual host (T21) sit around it.
 *
 * We only act on the events that change entitlement. Everything else is a no-op,
 * so unrelated webhook traffic can't accidentally toggle access.
 */

/** The minimal shape we read off a verified Stripe event. */
export interface StripeEventLike {
  type: string;
  data: {
    object: {
      /** Our PocketBase user id, set as Checkout/Subscription metadata. */
      metadata?: { userId?: string } | null;
      /** Subscription status for subscription.* events. */
      status?: string;
      /** Whether a checkout session completed with payment. */
      payment_status?: string;
    };
  };
}

export interface SubscriptionUpdate {
  userId: string;
  active: boolean;
}

const ACTIVE_SUB_STATUSES = new Set(["active", "trialing"]);

/**
 * Returns the entitlement change implied by an event, or null if the event
 * doesn't affect entitlement (or lacks the user id we need).
 */
export function mapStripeEvent(event: StripeEventLike): SubscriptionUpdate | null {
  const obj = event.data.object;
  const userId = obj.metadata?.userId;
  if (!userId) return null;

  switch (event.type) {
    case "checkout.session.completed":
      return obj.payment_status === "paid" ? { userId, active: true } : null;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      return { userId, active: ACTIVE_SUB_STATUSES.has(obj.status ?? "") };

    case "customer.subscription.deleted":
      return { userId, active: false };

    default:
      return null; // unrelated event — never touches entitlement
  }
}
