import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VocabReviewRenderer } from "./VocabReviewRenderer";
import type { VocabRender } from "./derive";

const fwd: VocabRender = {
  prompt: "perro",
  answer: "dog",
  notes: "el perro · m.",
  promptIsTarget: true,
};

describe("VocabReviewRenderer", () => {
  it("shows the prompt but hides the answer before reveal", () => {
    render(<VocabReviewRenderer render={fwd} revealed={false} ipa="ˈpe.ro" />);
    expect(screen.getByText("perro")).toBeInTheDocument();
    expect(screen.queryByText("dog")).not.toBeInTheDocument();
  });

  it("shows the answer, notes, and IPA after reveal", () => {
    render(<VocabReviewRenderer render={fwd} revealed={true} ipa="ˈpe.ro" />);
    expect(screen.getByText("dog")).toBeInTheDocument();
    expect(screen.getByText("el perro · m.")).toBeInTheDocument();
    expect(screen.getByText("[ˈpe.ro]")).toBeInTheDocument();
  });

  it("omits IPA when the prompt side is not the target language", () => {
    const rev: VocabRender = { ...fwd, prompt: "dog", answer: "perro", promptIsTarget: false };
    render(<VocabReviewRenderer render={rev} revealed={true} ipa="ˈpe.ro" />);
    expect(screen.queryByText("[ˈpe.ro]")).not.toBeInTheDocument();
  });
});
