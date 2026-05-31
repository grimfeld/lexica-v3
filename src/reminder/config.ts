import type { ReminderConfig } from "./schedule";

/*
 * Persistence for the daily-reminder preference (ADR-0005). Off by default — the
 * app never nudges unless the user turns it on. Stored in localStorage (a device
 * preference, not synced content). The last-fired date lives here too so the
 * once-per-day rule survives restarts.
 */

const KEY = "lexica.reminder";

const DEFAULT: ReminderConfig = {
  enabled: false, // off by default (ADR-0005)
  hour: 9,
  minute: 0,
  lastFiredDate: null,
};

export function getReminderConfig(): ReminderConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<ReminderConfig>) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveReminderConfig(config: ReminderConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
  } catch {
    // non-persistent environment; ignore
  }
}

/** Update fields and persist; returns the merged config. */
export function updateReminderConfig(patch: Partial<ReminderConfig>): ReminderConfig {
  const next = { ...getReminderConfig(), ...patch };
  saveReminderConfig(next);
  return next;
}
