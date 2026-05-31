import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SubscriptionSettings } from "./SubscriptionSettings";

describe("SubscriptionSettings", () => {
  it("prompts to sign in when entitlement is unknown", () => {
    render(<SubscriptionSettings active={null} onSubscribe={vi.fn()} />);
    expect(screen.getByText(/Sign in to manage/)).toBeInTheDocument();
  });

  it("shows Active and hides Subscribe when entitled", () => {
    render(<SubscriptionSettings active={true} onSubscribe={vi.fn()} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Subscribe" })).not.toBeInTheDocument();
  });

  it("launches checkout when not subscribed", async () => {
    const onSubscribe = vi.fn().mockResolvedValue(true);
    render(<SubscriptionSettings active={false} onSubscribe={onSubscribe} />);
    await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(onSubscribe).toHaveBeenCalled();
  });

  it("explains when checkout is unavailable", async () => {
    render(<SubscriptionSettings active={false} onSubscribe={vi.fn().mockResolvedValue(false)} />);
    await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(await screen.findByText("Checkout isn't available yet.")).toBeInTheDocument();
  });
});
