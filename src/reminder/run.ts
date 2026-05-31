import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { shouldFire, localDateKey } from "./schedule";
import { getReminderConfig, updateReminderConfig } from "./config";

/*
 * Live daily-reminder wiring (ADR-0005). When enabled and due, fires ONE plain
 * habit cue — "Time to practice?" — with no due count, no streak, no escalation.
 * Checked on app load and on an interval; the once-per-day guard lives in the
 * pure schedule rule + the persisted lastFiredDate.
 *
 * The message text is deliberately constant and content-free: this module never
 * reads how many cards are due, so it cannot become a nag.
 */

// Intentionally unconditional — the same gentle line every time (ADR-0005).
const TITLE = "Lexica";
const BODY = "Time to practice?";

async function ensurePermission(): Promise<boolean> {
  if (await isPermissionGranted()) return true;
  const result = await requestPermission();
  return result === "granted";
}

/**
 * Fire the reminder if it's due now. Safe to call repeatedly (app load, ticks):
 * the schedule rule fires at most once per local day. Returns true if it fired.
 */
export async function checkReminder(now: Date = new Date()): Promise<boolean> {
  const config = getReminderConfig();
  if (!shouldFire(config, now)) return false;

  if (!(await ensurePermission())) return false;
  sendNotification({ title: TITLE, body: BODY });
  updateReminderConfig({ lastFiredDate: localDateKey(now) });
  return true;
}

/** Request OS notification permission up front (when the user enables reminders). */
export async function requestReminderPermission(): Promise<boolean> {
  return ensurePermission();
}

const CHECK_INTERVAL_MS = 60 * 1000; // re-check each minute while the app is open
let timer: ReturnType<typeof setInterval> | null = null;

/** Start the periodic reminder check (call once on app load). */
export function startReminderLoop(): void {
  if (timer) return;
  void checkReminder();
  timer = setInterval(() => void checkReminder(), CHECK_INTERVAL_MS);
}
