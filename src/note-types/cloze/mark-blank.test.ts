import { describe, it, expect } from "vitest";
import { wrapSelectionAsBlank } from "./mark-blank";

describe("wrapSelectionAsBlank", () => {
  it("wraps the selected span in {{ }}", () => {
    expect(wrapSelectionAsBlank("Je suis content", 3, 7)).toBe("Je {{suis}} content");
  });

  it("leaves text unchanged for an empty selection", () => {
    expect(wrapSelectionAsBlank("Je suis", 3, 3)).toBe("Je suis");
  });

  it("refuses to wrap a selection that already contains a marker", () => {
    const t = "Je {{suis}} content";
    expect(wrapSelectionAsBlank(t, 0, t.length)).toBe(t);
  });
});
