import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DeckMembershipPicker } from "./DeckMembershipPicker";

const decks = [
  { id: "d1", name: "Travel" },
  { id: "d2", name: "Verbs" },
];

describe("DeckMembershipPicker", () => {
  it("reflects current memberships and toggles on", async () => {
    const onToggle = vi.fn();
    render(
      <DeckMembershipPicker decks={decks} memberOf={new Set(["d1"])} onToggle={onToggle} />,
    );
    expect(screen.getByLabelText("Travel")).toBeChecked();
    expect(screen.getByLabelText("Verbs")).not.toBeChecked();

    await userEvent.click(screen.getByLabelText("Verbs"));
    expect(onToggle).toHaveBeenCalledWith("d2", true);
  });

  it("toggles off an existing membership", async () => {
    const onToggle = vi.fn();
    render(
      <DeckMembershipPicker decks={decks} memberOf={new Set(["d1"])} onToggle={onToggle} />,
    );
    await userEvent.click(screen.getByLabelText("Travel"));
    expect(onToggle).toHaveBeenCalledWith("d1", false);
  });

  it("shows a hint when there are no decks", () => {
    render(<DeckMembershipPicker decks={[]} memberOf={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText("No decks yet.")).toBeInTheDocument();
  });
});
