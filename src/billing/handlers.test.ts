import { describe, it, expect, vi } from "vitest";
import { handleStripeWebhook, issueAccessToken } from "./handlers";
import { verifyToken } from "./jwt";
import type { StripeEventLike } from "./event-map";

const paidCheckout: StripeEventLike = {
  type: "checkout.session.completed",
  data: { object: { metadata: { userId: "u1" }, payment_status: "paid" } },
};

describe("handleStripeWebhook", () => {
  it("applies the entitlement change on a verified, relevant event", async () => {
    const setSubscriptionActive = vi.fn(async () => {});
    const res = await handleStripeWebhook("body", "sig", {
      verifyEvent: async () => paidCheckout,
      setSubscriptionActive,
    });
    expect(res).toEqual({ ok: true, applied: { userId: "u1", active: true } });
    expect(setSubscriptionActive).toHaveBeenCalledWith("u1", true);
  });

  it("rejects a bad signature without persisting", async () => {
    const setSubscriptionActive = vi.fn();
    const res = await handleStripeWebhook("body", "bad", {
      verifyEvent: async () => {
        throw new Error("bad sig");
      },
      setSubscriptionActive,
    });
    expect(res.ok).toBe(false);
    expect(setSubscriptionActive).not.toHaveBeenCalled();
  });

  it("verifies but applies nothing for an unrelated event", async () => {
    const setSubscriptionActive = vi.fn();
    const res = await handleStripeWebhook("body", "sig", {
      verifyEvent: async () => ({
        type: "invoice.created",
        data: { object: { metadata: { userId: "u1" } } },
      }),
      setSubscriptionActive,
    });
    expect(res).toEqual({ ok: true });
    expect(setSubscriptionActive).not.toHaveBeenCalled();
  });
});

describe("issueAccessToken", () => {
  it("mints a token the verifier accepts with the right claim", async () => {
    const secret = "s3cr3t";
    const now = 1_700_000_000;
    const token = await issueAccessToken("u1", true, { secret, nowSeconds: () => now });
    const res = await verifyToken(token, secret, now + 1);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.claims).toMatchObject({ sub: "u1", active: true });
  });
});
