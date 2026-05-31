import { describe, it, expect } from "vitest";
import { gate, bearer } from "./worker-gate";
import { signToken, makeClaims } from "../billing/jwt";

const SECRET = "worker-secret";
const NOW = 1_700_000_000;

describe("bearer", () => {
  it("extracts the token", () => {
    expect(bearer("Bearer abc.def.ghi")).toBe("abc.def.ghi");
    expect(bearer("bearer abc")).toBe("abc"); // case-insensitive scheme
  });
  it("returns null without a bearer scheme", () => {
    expect(bearer(null)).toBeNull();
    expect(bearer("Basic xyz")).toBeNull();
  });
});

describe("gate", () => {
  it("allows an active, valid token", async () => {
    const token = await signToken(makeClaims("u1", true, NOW), SECRET);
    const res = await gate(`Bearer ${token}`, SECRET, NOW + 60);
    expect(res).toEqual({ ok: true, userId: "u1" });
  });

  it("401s a missing token", async () => {
    const res = await gate(null, SECRET, NOW);
    expect(res).toMatchObject({ ok: false, status: 401 });
  });

  it("401s an expired token", async () => {
    const token = await signToken(makeClaims("u1", true, NOW), SECRET);
    const res = await gate(`Bearer ${token}`, SECRET, NOW + 100000);
    expect(res).toMatchObject({ ok: false, status: 401, reason: "expired" });
  });

  it("401s a wrong-secret token", async () => {
    const token = await signToken(makeClaims("u1", true, NOW), "other");
    const res = await gate(`Bearer ${token}`, SECRET, NOW + 60);
    expect(res).toMatchObject({ ok: false, status: 401, reason: "bad-signature" });
  });

  it("403s a valid but inactive token", async () => {
    const token = await signToken(makeClaims("u1", false, NOW), SECRET);
    const res = await gate(`Bearer ${token}`, SECRET, NOW + 60);
    expect(res).toEqual({ ok: false, status: 403, reason: "subscription inactive" });
  });
});
