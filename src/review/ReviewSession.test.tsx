import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReviewSession } from "./ReviewSession";
import type { ReviewItem } from "./session";
import { registerNoteType, __resetRegistry } from "../note-types/registry";
import { vocabNoteType } from "../note-types/vocab";

beforeEach(() => {
  __resetRegistry();
  registerNoteType(vocabNoteType);
});

const items: ReviewItem[] = [
  {
    cardId: "n1:fwd",
    noteId: "n1",
    typeId: "vocab",
    render: { prompt: "perro", answer: "dog", notes: "", promptIsTarget: true },
    ipa: "ˈpe.ro",
  },
];

describe("ReviewSession shell", () => {
  it("hides the answer until Show, then reveals and grades", async () => {
    const onGrade = vi.fn();
    render(<ReviewSession items={items} onGrade={onGrade} />);

    expect(screen.getByText("perro")).toBeInTheDocument();
    expect(screen.queryByText("dog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByText("dog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onGrade).toHaveBeenCalledWith("n1:fwd", true);
  });

  it("Miss grades as fail", async () => {
    const onGrade = vi.fn();
    render(<ReviewSession items={items} onGrade={onGrade} />);
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    await userEvent.click(screen.getByRole("button", { name: "Miss" }));
    expect(onGrade).toHaveBeenCalledWith("n1:fwd", false);
  });

  it("space reveals, then '2' grades Got", async () => {
    const onGrade = vi.fn();
    render(<ReviewSession items={items} onGrade={onGrade} />);
    await userEvent.keyboard(" ");
    expect(screen.getByText("dog")).toBeInTheDocument();
    await userEvent.keyboard("2");
    expect(onGrade).toHaveBeenCalledWith("n1:fwd", true);
  });

  it("shows a calm done state after the last card and calls onDone", async () => {
    const onDone = vi.fn();
    render(<ReviewSession items={items} onGrade={vi.fn()} onDone={onDone} />);
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.getByText("Done for now.")).toBeInTheDocument();
    expect(onDone).toHaveBeenCalled();
  });

  it("an empty queue shows nothing-ready, no guilt", () => {
    render(<ReviewSession items={[]} onGrade={vi.fn()} />);
    expect(screen.getByText("Nothing ready to review.")).toBeInTheDocument();
  });
});
