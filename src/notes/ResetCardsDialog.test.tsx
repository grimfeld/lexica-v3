import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ResetCardsDialog } from "./ResetCardsDialog";

describe("ResetCardsDialog (ADR-0009)", () => {
  it("resolves with only the cards the user checked", async () => {
    const onResolve = vi.fn();
    render(<ResetCardsDialog changed={["fwd", "rev"]} onResolve={onResolve} />);

    await userEvent.click(screen.getByLabelText("fwd"));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onResolve).toHaveBeenCalledWith(new Set(["fwd"]));
  });

  it("defaults to keeping all (nothing reset) — no silent reset", async () => {
    const onResolve = vi.fn();
    render(<ResetCardsDialog changed={["fwd", "rev"]} onResolve={onResolve} />);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onResolve).toHaveBeenCalledWith(new Set());
  });

  it("bulk 'Reset all' selects every changed card", async () => {
    const onResolve = vi.fn();
    render(<ResetCardsDialog changed={["fwd", "rev"]} onResolve={onResolve} />);
    await userEvent.click(screen.getByRole("button", { name: "Reset all" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onResolve).toHaveBeenCalledWith(new Set(["fwd", "rev"]));
  });
});
