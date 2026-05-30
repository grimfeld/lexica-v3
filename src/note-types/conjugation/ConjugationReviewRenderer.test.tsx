import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ConjugationReviewRenderer } from "./ConjugationReviewRenderer";
import type { ConjugationRender } from "./derive";

const r: ConjugationRender = {
  verb: "être",
  tense: "present",
  person: "tu",
  answer: "es",
  notes: "irregular",
};

describe("ConjugationReviewRenderer", () => {
  it("shows verb + tense/person, hides the answer before reveal", () => {
    render(<ConjugationReviewRenderer render={r} revealed={false} ipa={null} />);
    expect(screen.getByText("être")).toBeInTheDocument();
    expect(screen.getByText(/present/)).toBeInTheDocument();
    expect(screen.queryByText("es")).not.toBeInTheDocument();
  });

  it("reveals the conjugated cell + IPA", () => {
    render(<ConjugationReviewRenderer render={r} revealed={true} ipa="ɛ" />);
    expect(screen.getByText("es")).toBeInTheDocument();
    expect(screen.getByText("[ɛ]")).toBeInTheDocument();
  });
});
