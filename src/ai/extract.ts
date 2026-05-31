import type { FieldDescriptor, FieldValues } from "../note-types/contract";
import { validateFields } from "../note-types/validate";
import type { ChatClient } from "./chat";
import { describeFields } from "./authoring-assist";

/*
 * Text extraction (ADR-0007). The user supplies a document they are studying
 * (pasted text or a .txt/.md file — the document is itself the user's
 * real-world encounter). The AI extracts CANDIDATE Notes, choosing an
 * appropriate Note Type for each. Crucially, candidates are proposals: they
 * default UNSELECTED and nothing is created unless the user explicitly opts in
 * (the default-state rule is the load-bearing north-star check).
 *
 * Each candidate is bound to its chosen type's schema and validated with the
 * same gate as manual saves; candidates of unknown types or with invalid
 * fields are dropped, never surfaced as selectable.
 */

/** A type the extractor may assign, with its field schema for the prompt. */
export interface ExtractableType {
  id: string;
  name: string;
  fields: FieldDescriptor[];
}

/** A proposed Note for the user to review. Always starts unselected in the UI. */
export interface Candidate {
  type: string;
  fields: FieldValues;
}

export interface ExtractResult {
  ok: boolean;
  candidates?: Candidate[];
  error?: string;
}

/** Cap how much text we send and how many candidates we accept, to bound cost. */
const MAX_CHARS = 12000;

export function buildExtractPrompt(types: ExtractableType[], doc: string) {
  const typeBlocks = types
    .map((t) => `Type "${t.id}" (${t.name}):\n${describeFields(t.fields)}`)
    .join("\n\n");

  const system =
    "You extract flashcard candidates from a document a language learner is " +
    "studying. You do NOT decide what is worth learning — you surface what is in " +
    "the document so the learner can choose. For each candidate pick the most " +
    "fitting type from the list and fill its fields. Reply with ONLY a JSON " +
    'array of objects shaped {"type": <id>, "fields": {<field>: <value>}}. No ' +
    "prose, no markdown fences.";

  const user =
    `Available types:\n${typeBlocks}\n\n` +
    `Document:\n"""\n${doc.slice(0, MAX_CHARS)}\n"""\n\n` +
    `Return a JSON array of candidates. Use only the type ids and field keys above.`;

  return { system, user };
}

/** Tolerant parse: strip fences, grab the first [...] array. */
export function parseCandidatesJson(raw: string): unknown[] | null {
  const noFence = raw.replace(/```(?:json)?/gi, "").trim();
  const start = noFence.indexOf("[");
  const end = noFence.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const arr = JSON.parse(noFence.slice(start, end + 1));
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

/**
 * Keep only well-formed candidates whose type is known and whose fields pass
 * that type's validator. Everything else is silently dropped — an invalid
 * candidate is never offered to the user.
 */
export function filterValidCandidates(
  raw: unknown[],
  types: ExtractableType[],
): Candidate[] {
  const byId = new Map(types.map((t) => [t.id, t]));
  const out: Candidate[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const type = obj.type;
    const fields = obj.fields;
    if (typeof type !== "string" || !byId.has(type)) continue;
    if (typeof fields !== "object" || fields === null || Array.isArray(fields)) continue;
    const result = validateFields(byId.get(type)!.fields, fields as FieldValues);
    if (result.ok) out.push({ type, fields: fields as FieldValues });
  }
  return out;
}

/** Run extraction: prompt -> complete -> parse -> filter to valid candidates. */
export async function extractCandidates(
  client: ChatClient,
  types: ExtractableType[],
  doc: string,
): Promise<ExtractResult> {
  if (doc.trim() === "") return { ok: false, error: "Nothing to extract from." };

  let raw: string;
  try {
    raw = await client.complete(buildExtractPrompt(types, doc));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "AI request failed." };
  }

  const parsed = parseCandidatesJson(raw);
  if (!parsed) return { ok: false, error: "The AI reply wasn't a candidate list." };

  const candidates = filterValidCandidates(parsed, types);
  return { ok: true, candidates };
}
