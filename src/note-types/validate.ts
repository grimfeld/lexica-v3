import type { FieldDescriptor, FieldValues, TableField } from "./contract";

/*
 * Validates a Note's authored field values against its Type's declared schema.
 * This is the gate that AI-produced field values (authoring assist, extraction)
 * must pass before they can be saved (ADR-0007 / T15-16): invalid output is
 * rejected, never stored raw.
 */

export interface FieldError {
  key: string;
  error: "required" | "unknown" | "type" | "table";
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: FieldError[] };

function isFilled(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "";
}

function validateTable(field: TableField, value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const grid = value as Record<string, unknown>;
  for (const row of field.rows) {
    const cells = grid[row];
    if (typeof cells !== "object" || cells === null) return false;
    const rowObj = cells as Record<string, unknown>;
    for (const col of field.cols) {
      // Cell must be present and a string (may be empty — not every cell is
      // filled, but the structure must declare every row/col).
      if (typeof rowObj[col] !== "string") return false;
    }
  }
  return true;
}

export function validateFields(
  fields: FieldDescriptor[],
  values: FieldValues,
): ValidationResult {
  const errors: FieldError[] = [];
  const known = new Set(fields.map((f) => f.key));

  for (const key of Object.keys(values)) {
    if (!known.has(key)) errors.push({ key, error: "unknown" });
  }

  for (const field of fields) {
    const value = values[field.key];

    if (field.required && !isFilled(value)) {
      errors.push({ key: field.key, error: "required" });
      continue;
    }
    if (value === undefined || value === null) continue; // optional & absent

    if (field.kind === "table") {
      if (!validateTable(field, value)) {
        errors.push({ key: field.key, error: "table" });
      }
    } else if (typeof value !== "string") {
      errors.push({ key: field.key, error: "type" });
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
