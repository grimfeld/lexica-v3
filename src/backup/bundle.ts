/*
 * Portable backup bundle for local Storage Mode. The user exports to a file and
 * keeps it on any cloud drive (the local-mode "sync by hand" path). The bundle
 * is a versioned snapshot of live rows across every table.
 */

export const BUNDLE_VERSION = 1;

export interface Bundle {
  version: number;
  exportedAt: number;
  languages: Record<string, unknown>[];
  notes: Record<string, unknown>[];
  cards: Record<string, unknown>[];
  decks: Record<string, unknown>[];
  deckNotes: Record<string, unknown>[];
}

export type BundleTables = Omit<Bundle, "version" | "exportedAt">;

export function makeBundle(tables: BundleTables, exportedAt: number): Bundle {
  return { version: BUNDLE_VERSION, exportedAt, ...tables };
}

export function serializeBundle(bundle: Bundle): string {
  return JSON.stringify(bundle, null, 2);
}

export interface ParseResult {
  ok: boolean;
  bundle?: Bundle;
  error?: string;
}

const TABLE_KEYS: (keyof BundleTables)[] = [
  "languages",
  "notes",
  "cards",
  "decks",
  "deckNotes",
];

export function parseBundle(json: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "not valid JSON" };
  }
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "not an object" };
  }
  const b = raw as Record<string, unknown>;
  if (b.version !== BUNDLE_VERSION) {
    return { ok: false, error: `unsupported version: ${String(b.version)}` };
  }
  for (const key of TABLE_KEYS) {
    if (!Array.isArray(b[key])) {
      return { ok: false, error: `missing or invalid table: ${key}` };
    }
  }
  return { ok: true, bundle: b as unknown as Bundle };
}
