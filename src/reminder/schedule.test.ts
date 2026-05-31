import { describe, it, expect } from "vitest";
import { shouldFire, localDateKey, type ReminderConfig } from "./schedule";

const cfg = (over: Partial<ReminderConfig> = {}): ReminderConfig => ({
  enabled: true,
  hour: 9,
  minute: 0,
  lastFiredDate: null,
  ...over,
});

// A local Date at a given h:m on 2026-06-01.
const at = (h: number, m: number) => new Date(2026, 5, 1, h, m, 0);

describe("localDateKey", () => {
  it("formats the local calendar day", () => {
    expect(localDateKey(new Date(2026, 5, 1, 23, 30))).toBe("2026-06-01");
  });
});

describe("shouldFire", () => {
  it("does not fire when disabled", () => {
    expect(shouldFire(cfg({ enabled: false }), at(10, 0))).toBe(false);
  });

  it("does not fire before the configured time", () => {
    expect(shouldFire(cfg({ hour: 9, minute: 0 }), at(8, 59))).toBe(false);
  });

  it("fires at the configured time", () => {
    expect(shouldFire(cfg({ hour: 9, minute: 0 }), at(9, 0))).toBe(true);
  });

  it("fires after the configured time", () => {
    expect(shouldFire(cfg({ hour: 9, minute: 0 }), at(14, 30))).toBe(true);
  });

  it("does not fire twice on the same day", () => {
    expect(shouldFire(cfg({ lastFiredDate: "2026-06-01" }), at(10, 0))).toBe(false);
  });

  it("fires again the next day", () => {
    // last fired yesterday, now it's today past the time
    expect(shouldFire(cfg({ lastFiredDate: "2026-05-31" }), at(10, 0))).toBe(true);
  });

  it("respects the minute within the hour", () => {
    expect(shouldFire(cfg({ hour: 9, minute: 30 }), at(9, 15))).toBe(false);
    expect(shouldFire(cfg({ hour: 9, minute: 30 }), at(9, 45))).toBe(true);
  });
});
