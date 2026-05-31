/*
 * Client-side config for the hosted AI path (ADR-0006): the Cloudflare Worker
 * base URL. BYOK needs none of this; it's only for the app-key path. Persisted
 * in localStorage so it survives reloads without touching the synced DB (the URL
 * is device/config, not user content).
 */

const KEY = "lexica.aiWorkerUrl";

export function getWorkerUrl(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setWorkerUrl(url: string): void {
  try {
    if (url.trim() === "") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, url.trim());
  } catch {
    // non-persistent environment; ignore
  }
}
