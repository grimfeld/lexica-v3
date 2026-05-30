import { useState } from "react";
import {
  listNoteTypes,
  getNoteType,
  validateFields,
  type FieldValues,
} from "../note-types";

/*
 * The generic authoring shell. It owns type selection and save/validate; the
 * type-specific fields are delegated to the chosen type's AuthoringForm
 * (ADR-0003). Persistence is injected via `onSave` so the shell stays testable
 * and decoupled from the repository/DB.
 */

export interface NoteAuthoringShellProps {
  /** Persist a valid note. Returns when saved. */
  onSave: (note: { type: string; fields: FieldValues }) => Promise<void>;
  /** Editing an existing note: preset type + values (type picker locked). */
  initial?: { type: string; fields: FieldValues };
}

export function NoteAuthoringShell({ onSave, initial }: NoteAuthoringShellProps) {
  const types = listNoteTypes();
  const [type, setType] = useState(initial?.type ?? types[0]?.id ?? "");
  const [fields, setFields] = useState<FieldValues>(initial?.fields ?? {});
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const module = type ? getNoteType(type) : null;

  async function save() {
    if (!module) return;
    const result = validateFields(module.fields, fields);
    if (!result.ok) {
      setErrors(result.errors.map((e) => `${e.key}: ${e.error}`));
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onSave({ type, fields });
      if (!initial) setFields({}); // reset after a fresh create
    } finally {
      setSaving(false);
    }
  }

  const Form = module?.AuthoringForm;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-ink-muted)]">Type</span>
        <select
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setFields({});
          }}
          disabled={!!initial}
        >
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      {Form && <Form value={fields} onChange={setFields} />}

      {errors.length > 0 && (
        <ul className="text-sm text-[var(--color-miss)]">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <button
        className="self-start rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-[var(--color-accent-ink)] disabled:opacity-50"
        onClick={save}
        disabled={saving}
      >
        {initial ? "Save changes" : "Add note"}
      </button>
    </div>
  );
}
