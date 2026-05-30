import { describe, it, expect } from "vitest";
import { validateFields } from "./validate";
import type { FieldDescriptor } from "./contract";

const fields: FieldDescriptor[] = [
  { key: "term", label: "Term", kind: "text", required: true, ipa: true },
  { key: "meaning", label: "Meaning", kind: "text", required: true },
  { key: "notes", label: "Notes", kind: "longtext" },
  {
    key: "table",
    label: "Conjugation",
    kind: "table",
    rows: ["present", "past"],
    cols: ["je", "tu"],
  },
];

describe("validateFields", () => {
  it("accepts a valid value set", () => {
    const r = validateFields(fields, {
      term: "perro",
      meaning: "dog",
      notes: "",
      table: { present: { je: "suis", tu: "es" }, past: { je: "", tu: "" } },
    });
    expect(r.ok).toBe(true);
  });

  it("rejects a missing required field", () => {
    const r = validateFields(fields, { meaning: "dog" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContainEqual({ key: "term", error: "required" });
  });

  it("rejects an unknown field key", () => {
    const r = validateFields(fields, { term: "x", meaning: "y", bogus: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContainEqual({ key: "bogus", error: "unknown" });
  });

  it("rejects a non-string text field", () => {
    const r = validateFields(fields, { term: 42, meaning: "y" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContainEqual({ key: "term", error: "type" });
  });

  it("accepts a partial table (only known cells filled)", () => {
    const r = validateFields(fields, {
      term: "x",
      meaning: "y",
      table: { present: { je: "a" } }, // 'tu'/'past' omitted — allowed
    });
    expect(r.ok).toBe(true);
  });

  it("rejects a table cell under an undeclared column", () => {
    const r = validateFields(fields, {
      term: "x",
      meaning: "y",
      table: { present: { bogus: "a" } },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.key === "table")).toBe(true);
  });

  it("treats empty string as absent for required fields", () => {
    const r = validateFields(fields, { term: "", meaning: "dog" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContainEqual({ key: "term", error: "required" });
  });
});
