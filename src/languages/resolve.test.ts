import { describe, it, expect } from "vitest";
import { resolveActiveLanguage } from "./resolve";

const langs = [{ id: "es" }, { id: "ja" }];

describe("resolveActiveLanguage", () => {
  it("keeps a valid active id", () => {
    expect(resolveActiveLanguage("ja", langs)).toBe("ja");
  });

  it("falls back to the first when the active id is missing", () => {
    expect(resolveActiveLanguage("de", langs)).toBe("es");
  });

  it("falls back to the first when active id is null", () => {
    expect(resolveActiveLanguage(null, langs)).toBe("es");
  });

  it("returns null when there are no languages", () => {
    expect(resolveActiveLanguage("es", [])).toBeNull();
  });
});
