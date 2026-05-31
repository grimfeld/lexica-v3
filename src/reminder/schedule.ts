/*
 * The daily-reminder timing rule (ADR-0005). A single, opt-in, user-set daily
 * cue that fires UNCONDITIONALLY — a plain "time to practice?" habit nudge, never
 * a due-count nag or an escalating notification. This module holds only the
 * decision of whether the reminder is due right now; it carries no card counts
 * by design, and it's pure so the once-per-day timing is unit-tested.
 *
 * Rule: when enabled, fire at most once per local calendar day, at or after the
 * configured hour:minute, and only if it hasn't already fired that day.
 */

export interface ReminderConfig {
  enabled: boolean;
  hour: number; // 0–23, local
  minute: number; // 0–59, local
  /** Local date string (YYYY-MM-DD) the reminder last fired on, or null. */
  lastFiredDate: string | null;
}

/** Local YYYY-MM-DD for a Date (so "today" is the user's calendar day). */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Should the reminder fire at `now`? True only when enabled, the local time has
 * reached the configured hour:minute today, and it hasn't already fired today.
 */
export function shouldFire(config: ReminderConfig, now: Date): boolean {
  if (!config.enabled) return false;

  const today = localDateKey(now);
  if (config.lastFiredDate === today) return false; // already fired today

  const reachedTime =
    now.getHours() > config.hour ||
    (now.getHours() === config.hour && now.getMinutes() >= config.minute);

  return reachedTime;
}
