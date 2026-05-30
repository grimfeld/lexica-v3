import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatsView } from "./StatsView";

describe("StatsView", () => {
  it("renders overall + per-deck retention, no streak language", () => {
    render(
      <StatsView
        overall={{ totalCards: 10, newCards: 2, matureCards: 6, retentionRate: 0.92 }}
        perDeck={[
          {
            deckId: "d1",
            name: "Travel",
            stats: { totalCards: 4, newCards: 1, matureCards: 2, retentionRate: 0.75 },
          },
        ]}
      />,
    );
    expect(screen.getByText("All notes")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    // No engagement framing.
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/day/i)).not.toBeInTheDocument();
  });

  it("shows an em dash for retention when nothing reviewed", () => {
    render(
      <StatsView
        overall={{ totalCards: 0, newCards: 0, matureCards: 0, retentionRate: null }}
        perDeck={[]}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
