import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DeckList } from "./DeckList";

const decks = [
  { id: "d1", name: "Travel", noteCount: 3 },
  { id: "d2", name: "Verbs", noteCount: 1 },
];

describe("DeckList", () => {
  it("creates a deck from the name input", async () => {
    const onCreate = vi.fn();
    render(
      <DeckList decks={[]} onCreate={onCreate} onRename={vi.fn()} onDelete={vi.fn()} onReview={vi.fn()} />,
    );
    await userEvent.type(screen.getByLabelText("New deck name"), "Food");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onCreate).toHaveBeenCalledWith("Food");
  });

  it("shows note counts and launches a deck review", async () => {
    const onReview = vi.fn();
    render(
      <DeckList decks={decks} onCreate={vi.fn()} onRename={vi.fn()} onDelete={vi.fn()} onReview={onReview} />,
    );
    expect(screen.getByText("3 notes")).toBeInTheDocument();
    expect(screen.getByText("1 note")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Review" })[0]);
    expect(onReview).toHaveBeenCalledWith("d1");
  });

  it("deletes a deck", async () => {
    const onDelete = vi.fn();
    render(
      <DeckList decks={decks} onCreate={vi.fn()} onRename={vi.fn()} onDelete={onDelete} onReview={vi.fn()} />,
    );
    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[1]);
    expect(onDelete).toHaveBeenCalledWith("d2");
  });
});
