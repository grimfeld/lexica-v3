import { verifyToken } from "../billing/jwt";

/*
 * The subscription gate for the Worker AI proxy (ADR-0006). Every proxied AI
 * request must present a valid, unexpired access token whose `active` claim is
 * true. This is the server-side enforcement point for the app-key paywall — the
 * provider keys live in the Worker, so this is the only thing standing between a
 * request and the app's keys. Pure + TDD'd; the Worker entry is a thin wrapper.
 */

export type GateResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; reason: string };

/** Extract a bearer token from an Authorization header value. */
export function bearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Authorize a proxied AI request. 401 = no/invalid/expired token (authenticate),
 * 403 = valid token but not entitled (subscription inactive).
 */
export async function gate(
  authHeader: string | null,
  secret: string,
  nowSeconds: number,
): Promise<GateResult> {
  const token = bearer(authHeader);
  if (!token) return { ok: false, status: 401, reason: "missing token" };

  const res = await verifyToken(token, secret, nowSeconds);
  if (!res.ok) return { ok: false, status: 401, reason: res.reason };

  if (!res.claims.active) {
    return { ok: false, status: 403, reason: "subscription inactive" };
  }
  return { ok: true, userId: res.claims.sub };
}
