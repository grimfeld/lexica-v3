import { describe, it, expect } from "vitest";
import { computeRetentionStats, type CardStat } from "./compute";

// State: 0 New, 1 Learning, 2 Review, 3 Relearning (ts-fsrs)
const card = (state: number, reps: number, lapses: number): CardStat => ({
  state,
  reps,
  lapses,
});

describe("computeRetentionStats", () => {
  it("counts totals and mature (Review-state) cards", () => {
    const s = computeRetentionStats([
      card(0, 0, 0), // new
      card(1, 1, 0), // learning
      card(2, 5, 1), // mature
      card(2, 8, 0), // mature
      card(3, 6, 2), // relearning (lapsed)
    ]);
    expect(s.totalCards).toBe(5);
    expect(s.matureCards).toBe(2);
    expect(s.newCards).toBe(1);
  });

  it("retention rate = 1 - lapses/reps over reviewed cards", () => {
    const s = computeRetentionStats([
      card(2, 10, 1), // 9/10
      card(2, 10, 1), // 9/10
    ]);
    // total reps 20, total lapses 2 -> 0.9
    expect(s.retentionRate).toBeCloseTo(0.9);
  });

  it("ignores never-reviewed cards in the retention rate", () => {
    const s = computeRetentionStats([
      card(0, 0, 0), // new, no reps -> excluded
      card(2, 4, 0), // 4/4
    ]);
    expect(s.retentionRate).toBeCloseTo(1);
  });

  it("retention rate is null when nothing has been reviewed", () => {
    const s = computeRetentionStats([card(0, 0, 0)]);
    expect(s.retentionRate).toBeNull();
  });

  it("handles an empty set", () => {
    const s = computeRetentionStats([]);
    expect(s.totalCards).toBe(0);
    expect(s.retentionRate).toBeNull();
  });
});
