import type { FieldDescriptor, FieldValues } from "../note-types/contract";
import { validateFields } from "../note-types/validate";
import type { ChatClient } from "./chat";

/*
 * Authoring assist (ADR-0007): the user supplies a SEED (a word/phrase they
 * encountered); the AI fills the chosen Note Type's fields. The user then edits
 * and confirms — nothing is saved here. AI does the labor, the user owns the
 * content and the decision.
 *
 * The output is bound to the type's machine-readable field schema and checked
 * with the SAME validator that gates manual saves. Invalid output is rejected
 * and retried (bounded); we never hand back un-schema'd fields.
 */

export interface AssistResult {
  ok: boolean;
  fields?: FieldValues;
  error?: string;
}

const MAX_ATTEMPTS = 2;

/** A compact, model-readable description of the fields to fill. */
export function describeFields(fields: FieldDescriptor[]): string {
  return fields
    .map((f) => {
      const req = f.required ? " (required)" : "";
      if (f.kind === "table") {
        return `- "${f.key}": a table${req}. Rows: [${f.rows.join(", ")}]. Columns: [${f.cols.join(
          ", ",
        )}]. Value is an object of row -> { column: string }. Fill only cells you are confident about.`;
      }
      const ipa = f.ipa ? " This is target-language text." : "";
      return `- "${f.key}": ${f.kind} string${req}.${ipa}`;
    })
    .join("\n");
}

export function buildPrompt(
  typeName: string,
  fields: FieldDescriptor[],
  seed: string,
  priorError?: string,
): { system: string; user: string } {
  const system =
    "You help a language learner fill in flashcard fields from a word or phrase " +
    "they supply. You do NOT decide what they should learn — you only structure " +
    "the material they give you. Reply with ONLY a JSON object mapping field " +
    "keys to values, no prose, no markdown fences.";

  const retry = priorError
    ? `\n\nYour previous reply was rejected: ${priorError}. Return corrected JSON only.`
    : "";

  const user =
    `Note type: ${typeName}\n` +
    `Fields to fill:\n${describeFields(fields)}\n\n` +
    `Source from the learner: "${seed}"\n\n` +
    `Return a JSON object with only the field keys above.${retry}`;

  return { system, user };
}

/** Tolerant JSON extraction: strip ``` fences and grab the first {...} block. */
export function parseFieldsJson(raw: string): FieldValues | null {
  const noFence = raw.replace(/```(?:json)?/gi, "").trim();
  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const obj = JSON.parse(noFence.slice(start, end + 1));
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
    return obj as FieldValues;
  } catch {
    return null;
  }
}

/**
 * Run the assist loop: prompt -> complete -> parse -> validate, retrying on
 * malformed or schema-invalid output up to MAX_ATTEMPTS. Returns proposed
 * fields for the user to review; it never persists.
 */
export async function assistFields(
  client: ChatClient,
  typeName: string,
  fields: FieldDescriptor[],
  seed: string,
): Promise<AssistResult> {
  if (seed.trim() === "") return { ok: false, error: "Enter a word or phrase first." };

  let priorError: string | undefined;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const prompt = buildPrompt(typeName, fields, seed, priorError);
    let raw: string;
    try {
      raw = await client.complete(prompt);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "AI request failed." };
    }

    const parsed = parseFieldsJson(raw);
    if (!parsed) {
      priorError = "the reply was not valid JSON";
      continue;
    }

    const result = validateFields(fields, parsed);
    if (result.ok) return { ok: true, fields: parsed };
    priorError = result.errors.map((e) => `${e.key}: ${e.error}`).join(", ");
  }

  return { ok: false, error: `AI output didn't match the fields (${priorError}).` };
}
