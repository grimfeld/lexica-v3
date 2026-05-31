import { describe, it, expect } from "vitest";
import { chooseTransport } from "./transport";

describe("chooseTransport", () => {
  it("prefers BYOK when a key is present (even if a subscription exists)", () => {
    const t = chooseTransport({ hasByokKey: true, accessToken: "tok", workerUrl: "https://w" });
    expect(t).toEqual({ kind: "byok" });
  });

  it("uses the app-key path for an active subscriber with a Worker", () => {
    const t = chooseTransport({ hasByokKey: false, accessToken: "tok", workerUrl: "https://w" });
    expect(t).toEqual({ kind: "app-key", workerUrl: "https://w", token: "tok" });
  });

  it("is off with neither key nor subscription", () => {
    const t = chooseTransport({ hasByokKey: false, accessToken: null, workerUrl: null });
    expect(t).toMatchObject({ kind: "none" });
  });

  it("is off when subscribed but no Worker is configured", () => {
    const t = chooseTransport({ hasByokKey: false, accessToken: "tok", workerUrl: null });
    expect(t).toMatchObject({ kind: "none" });
  });
});
