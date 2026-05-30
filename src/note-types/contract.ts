import type { ComponentType } from "react";

/*
 * The Note Type module contract (ADR-0003).
 *
 * A Note Type is a self-contained, code-defined module owning ALL of its UI.
 * Five parts: field schema, which fields bear Pronunciation, a deriveCards
 * rule, a review renderer, and an authoring form. The developer adds types;
 * users cannot define their own.
 *
 * `fields` is intentionally a machine-readable descriptor (not just TS types)
 * so the AI authoring-assist / extraction features (ADR-0007) can target it and
 * a validator can check authored or AI-produced values against it.
 */

// ---- Field schema (declarative, machine-readable) -------------------------

export type FieldKind = "text" | "longtext" | "table";

interface FieldBase {
  /** Stable key used in the Note's stored `fields` object. */
  key: string;
  /** Human label for the authoring form. */
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** This field holds target-language text and may receive Pronunciation. */
  ipa?: boolean;
}

export interface TextField extends FieldBase {
  kind: "text" | "longtext";
}

/** A 2-D grid of cells, e.g. a conjugation table (tense × person). */
export interface TableField extends FieldBase {
  kind: "table";
  rows: string[];
  cols: string[];
}

export type FieldDescriptor = TextField | TableField;

/** Authored values for a Note, keyed by field key. Shape per type. */
export type FieldValues = Record<string, unknown>;

// ---- Derivation (ADR-0009) ------------------------------------------------

/**
 * A review prompt derived from a Note. `sliceKey` is the STABLE identity of
 * this slice within the Note (e.g. "présent/je", "fwd", "blank:3"); it must be
 * deterministic for the same authored content so Note edits diff cleanly
 * without nuking FSRS history. FSRS state is attached later by the engine.
 */
export interface DerivedCard {
  sliceKey: string;
  /** Type-specific render payload consumed by the type's review renderer. */
  render: unknown;
}

// ---- Component prop contracts ---------------------------------------------

export interface ReviewRendererProps {
  /** The derived card's render payload (see DerivedCard.render). */
  render: unknown;
  /** True once the user has revealed the answer. */
  revealed: boolean;
  /** IPA aid for this card's target text, if available (display-only). */
  ipa?: string | null;
}

export interface AuthoringFormProps {
  value: FieldValues;
  onChange: (next: FieldValues) => void;
}

// ---- The module -----------------------------------------------------------

export interface NoteTypeModule {
  /** Stable identifier stored on `notes.type`. */
  id: string;
  /** Human name for the type picker. */
  name: string;
  fields: FieldDescriptor[];
  /** Derive every reviewable Card from a Note's authored field values. */
  deriveCards: (fields: FieldValues) => DerivedCard[];
  ReviewRenderer: ComponentType<ReviewRendererProps>;
  AuthoringForm: ComponentType<AuthoringFormProps>;
}

/** Field keys declared as IPA-bearing — convenience over `fields`. */
export function ipaFields(module: NoteTypeModule): string[] {
  return module.fields.filter((f) => f.ipa).map((f) => f.key);
}
