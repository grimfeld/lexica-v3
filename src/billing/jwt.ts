/*
 * Minimal HS256 JWT for the subscription gate (ADR-0006). On login the server
 * mints a SHORT-LIVED (~15 min) token carrying an `active` subscription claim;
 * the Cloudflare Worker AI proxy (T21) verifies it before using the app's keys.
 * Cancellation propagates within the token's lifetime — no per-request Stripe or
 * PocketBase call on the hot path.
 *
 * Pure + dependency-free: built on Web Crypto (available in the Tauri webview,
 * Node test env, and Workers), so the same code verifies on client and server.
 * This is the security-critical boundary for paid AI, so it's TDD'd.
 */

export interface AccessClaims {
  /** Subject — the PocketBase user id. */
  sub: string;
  /** True iff the subscription is active. */
  active: boolean;
  /** Issued-at (epoch seconds). */
  iat: number;
  /** Expiry (epoch seconds). */
  exp: number;
}

/** Default token lifetime: 15 minutes (ADR-0006). */
export const TOKEN_TTL_SECONDS = 15 * 60;

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Sign claims into a compact JWT (HS256). */
export async function signToken(claims: AccessClaims, secret: string): Promise<string> {
  const header = b64urlEncode(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = b64urlEncode(enc.encode(JSON.stringify(claims)));
  const signingInput = `${header}.${payload}`;
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(signingInput)));
  return `${signingInput}.${b64urlEncode(sig)}`;
}

export type VerifyResult =
  | { ok: true; claims: AccessClaims }
  | { ok: false; reason: "malformed" | "bad-signature" | "expired" };

/**
 * Verify signature and expiry. `nowSeconds` is injectable for deterministic
 * tests. A token whose signature doesn't match the secret, or that has expired,
 * is rejected — the caller must treat a non-ok result as "no access".
 */
export async function verifyToken(
  token: string,
  secret: string,
  nowSeconds: number,
): Promise<VerifyResult> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [header, payload, sig] = parts;

  const key = await hmacKey(secret);
  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig) as BufferSource,
      enc.encode(`${header}.${payload}`),
    );
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!valid) return { ok: false, reason: "bad-signature" };

  let claims: AccessClaims;
  try {
    claims = JSON.parse(dec.decode(b64urlDecode(payload))) as AccessClaims;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof claims.exp !== "number" || claims.exp <= nowSeconds) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, claims };
}

/** Build claims for a user at issue time. */
export function makeClaims(
  userId: string,
  active: boolean,
  nowSeconds: number,
  ttl = TOKEN_TTL_SECONDS,
): AccessClaims {
  return { sub: userId, active, iat: nowSeconds, exp: nowSeconds + ttl };
}
