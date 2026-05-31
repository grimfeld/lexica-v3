/*
 * Client opt-in for the global TTS cache (ADR-0008). Free and independent of
 * card Storage Mode — a fully-local user can still opt in. Persisted in
 * localStorage (a device preference, not synced content).
 */

const KEY = "lexica.globalTtsCache";

export function globalTtsEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setGlobalTtsEnabled(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // non-persistent environment; ignore
  }
}
