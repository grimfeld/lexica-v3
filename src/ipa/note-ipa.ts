import { getNoteType, ipaFields, type FieldValues } from "../note-types";
import type { IpaFieldValue } from "./repository";

/*
 * Bridges a Note's authored fields to the pronunciation queue: which fields bear
 * IPA (declared by the Note Type via `ipaFields`) and their current text values.
 * Used when enqueuing a Note for backfill on create/edit.
 */
export function ipaFieldValues(typeId: string, fields: FieldValues): IpaFieldValue[] {
  const keys = ipaFields(getNoteType(typeId));
  const out: IpaFieldValue[] = [];
  for (const key of keys) {
    const v = fields[key];
    if (typeof v === "string") out.push({ fieldKey: key, text: v });
  }
  return out;
}
