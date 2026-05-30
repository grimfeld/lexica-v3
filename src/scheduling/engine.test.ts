import { describe, it, expect } from "vitest";
import {
  newCardState,
  grade,
  serializeState,
  deserializeState,
  isDue,
} from "./engine";

const T0 = new Date("2026-01-01T00:00:00Z");

describe("FSRS engine", () => {
  it("a new card is due immediately", () => {
    const s = newCardState(T0);
    expect(isDue(s, T0)).toBe(true);
  });

  it("a passing grade pushes the due date into the future", () => {
    const s = newCardState(T0);
    const next = grade(s, true, T0);
    expect(next.due.getTime()).toBeGreaterThan(T0.getTime());
  });

  it("a failing grade schedules sooner than a passing grade", () => {
    const s = newCardState(T0);
    const passed = grade(s, true, T0);
    const failed = grade(s, false, T0);
    expect(failed.due.getTime()).toBeLessThan(passed.due.getTime());
  });

  it("records a review: reps increases on pass", () => {
    const s = newCardState(T0);
    const next = grade(s, true, T0);
    expect(next.reps).toBe(s.reps + 1);
  });

  it("counts a lapse on a failed review of a learned card", () => {
    const s = newCardState(T0);
    // graduate it first
    let learned = grade(s, true, T0);
    learned = grade(learned, true, new Date(learned.due));
    const lapsed = grade(learned, false, new Date(learned.due));
    expect(lapsed.lapses).toBeGreaterThanOrEqual(learned.lapses);
  });

  it("serializes and deserializes state round-trip", () => {
    const s = grade(newCardState(T0), true, T0);
    const restored = deserializeState(serializeState(s));
    expect(restored.due.getTime()).toBe(s.due.getTime());
    expect(restored.stability).toBeCloseTo(s.stability);
    expect(restored.reps).toBe(s.reps);
  });

  it("is not due before its due date, due after", () => {
    const s = grade(newCardState(T0), true, T0);
    const before = new Date(s.due.getTime() - 1000);
    const after = new Date(s.due.getTime() + 1000);
    expect(isDue(s, before)).toBe(false);
    expect(isDue(s, after)).toBe(true);
  });
});
