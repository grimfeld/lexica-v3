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
  // Tables may be partial — the user fills only the rows/cells they know.
  // Validate only what IS present: each present row must be a declared row, and
  // each present cell must be a declared col with a string value. Missing
  // rows/cells are allowed.
  for (const row of Object.keys(grid)) {
    if (!field.rows.includes(row)) return false;
    const cells = grid[row];
    if (typeof cells !== "object" || cells === null) return false;
    const rowObj = cells as Record<string, unknown>;
    for (const col of Object.keys(rowObj)) {
      if (!field.cols.includes(col)) return false;
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
