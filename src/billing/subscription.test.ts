import { describe, it, expect, vi } from "vitest";
import { createSubscription, type SubscriptionPorts } from "./subscription";

function ports(over: Partial<SubscriptionPorts> = {}): SubscriptionPorts {
  return {
    readActive: vi.fn(async () => true),
    startCheckout: vi.fn(async () => "https://checkout.stripe.com/x"),
    fetchAccessToken: vi.fn(async () => "tok"),
    openUrl: vi.fn(),
    ...over,
  };
}

describe("subscription access", () => {
  it("reports active when the mirror flag is true", async () => {
    const sub = createSubscription(ports({ readActive: vi.fn(async () => true) }));
    expect(await sub.isActive()).toBe(true);
  });

  it("reports inactive when signed out (null)", async () => {
    const sub = createSubscription(ports({ readActive: vi.fn(async () => null) }));
    expect(await sub.isActive()).toBe(false);
  });

  it("opens the checkout URL", async () => {
    const p = ports();
    const sub = createSubscription(p);
    const ok = await sub.subscribe();
    expect(ok).toBe(true);
    expect(p.openUrl).toHaveBeenCalledWith("https://checkout.stripe.com/x");
  });

  it("returns false if no checkout URL is available", async () => {
    const p = ports({ startCheckout: vi.fn(async () => null) });
    const sub = createSubscription(p);
    expect(await sub.subscribe()).toBe(false);
    expect(p.openUrl).not.toHaveBeenCalled();
  });

  it("only fetches a token when entitled", async () => {
    const fetchAccessToken = vi.fn(async () => "tok");
    const inactive = createSubscription(ports({ readActive: vi.fn(async () => false), fetchAccessToken }));
    expect(await inactive.accessToken()).toBeNull();
    expect(fetchAccessToken).not.toHaveBeenCalled();

    const active = createSubscription(ports({ readActive: vi.fn(async () => true), fetchAccessToken }));
    expect(await active.accessToken()).toBe("tok");
  });
});
