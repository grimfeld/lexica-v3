import { describe, it, expect } from "vitest";
import { mapStripeEvent, type StripeEventLike } from "./event-map";

const ev = (type: string, object: StripeEventLike["data"]["object"]): StripeEventLike => ({
  type,
  data: { object },
});

const meta = { metadata: { userId: "u1" } };

describe("mapStripeEvent", () => {
  it("activates on a paid checkout", () => {
    expect(mapStripeEvent(ev("checkout.session.completed", { ...meta, payment_status: "paid" })))
      .toEqual({ userId: "u1", active: true });
  });

  it("ignores an unpaid checkout", () => {
    expect(mapStripeEvent(ev("checkout.session.completed", { ...meta, payment_status: "unpaid" })))
      .toBeNull();
  });

  it("activates on an active/trialing subscription", () => {
    expect(mapStripeEvent(ev("customer.subscription.updated", { ...meta, status: "active" })))
      .toEqual({ userId: "u1", active: true });
    expect(mapStripeEvent(ev("customer.subscription.created", { ...meta, status: "trialing" })))
      .toEqual({ userId: "u1", active: true });
  });

  it("deactivates on a past_due / canceled subscription", () => {
    expect(mapStripeEvent(ev("customer.subscription.updated", { ...meta, status: "past_due" })))
      .toEqual({ userId: "u1", active: false });
  });

  it("deactivates on subscription deletion", () => {
    expect(mapStripeEvent(ev("customer.subscription.deleted", { ...meta, status: "canceled" })))
      .toEqual({ userId: "u1", active: false });
  });

  it("is a no-op for unrelated events", () => {
    expect(mapStripeEvent(ev("invoice.created", { ...meta }))).toBeNull();
  });

  it("is a no-op when the user id is missing", () => {
    expect(mapStripeEvent(ev("checkout.session.completed", { payment_status: "paid" }))).toBeNull();
  });
});
