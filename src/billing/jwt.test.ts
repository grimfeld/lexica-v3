import { describe, it, expect } from "vitest";
import { signToken, verifyToken, makeClaims, TOKEN_TTL_SECONDS } from "./jwt";

const SECRET = "test-secret-key";
const NOW = 1_700_000_000;

describe("makeClaims", () => {
  it("sets a 15-minute expiry by default", () => {
    const c = makeClaims("user1", true, NOW);
    expect(c.exp - c.iat).toBe(TOKEN_TTL_SECONDS);
    expect(c).toMatchObject({ sub: "user1", active: true });
  });
});

describe("sign + verify", () => {
  it("round-trips valid claims", async () => {
    const claims = makeClaims("user1", true, NOW);
    const token = await signToken(claims, SECRET);
    const res = await verifyToken(token, SECRET, NOW + 60);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.claims).toMatchObject({ sub: "user1", active: true });
  });

  it("rejects an expired token", async () => {
    const token = await signToken(makeClaims("user1", true, NOW), SECRET);
    const res = await verifyToken(token, SECRET, NOW + TOKEN_TTL_SECONDS + 1);
    expect(res).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a wrong-secret signature", async () => {
    const token = await signToken(makeClaims("user1", true, NOW), SECRET);
    const res = await verifyToken(token, "different-secret", NOW + 60);
    expect(res).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("rejects a tampered payload", async () => {
    const token = await signToken(makeClaims("user1", false, NOW), SECRET);
    const [h, , s] = token.split(".");
    // Swap in a forged 'active:true' payload, keep the original signature.
    const forged = btoa(JSON.stringify({ sub: "user1", active: true, iat: NOW, exp: NOW + 900 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const res = await verifyToken(`${h}.${forged}.${s}`, SECRET, NOW + 60);
    expect(res.ok).toBe(false);
  });

  it("rejects a malformed token", async () => {
    const res = await verifyToken("not.a.jwt.token", SECRET, NOW);
    expect(res.ok).toBe(false);
  });

  it("carries an inactive claim through verification", async () => {
    const token = await signToken(makeClaims("user1", false, NOW), SECRET);
    const res = await verifyToken(token, SECRET, NOW + 60);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.claims.active).toBe(false);
  });
});
