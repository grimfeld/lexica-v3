import { services } from "../services";
import { keyStore, activeChatProvider } from "../ai";
import { chatClientFor } from "../ai/chat";
import { ipaFieldValues } from "./note-ipa";
import { runBackfill, type BackfillSummary } from "./backfill";
import type { FieldValues } from "../note-types";

/*
 * Live wiring for the Pronunciation pipeline (ADR-0002). Enqueue a Note's
 * IPA-bearing fields on save, and drain the queue with the active chat provider
 * (if any) for the LLM fallback. Both are fire-and-forget from the UI's point of
 * view — authoring never blocks on IPA.
 */

/** Queue a Note's IPA fields for backfill (called after create/edit). */
export async function enqueueNoteIpa(
  noteId: string,
  typeId: string,
  fields: FieldValues,
): Promise<void> {
  await services.pronunciations.enqueueForNote(noteId, ipaFieldValues(typeId, fields));
}

/** Resolve the active chat client for the LLM tier, or null (dict-only). */
async function chatForIpa() {
  const providerId = await activeChatProvider();
  if (!providerId) return null;
  const key = await keyStore.getKey(providerId);
  return key ? chatClientFor(providerId, key) : null;
}

/** Run one backfill pass over the pending/failed queue. */
export async function backfillIpa(): Promise<BackfillSummary> {
  const chat = await chatForIpa();
  return runBackfill({
    repo: services.pronunciations,
    languageOf: (noteId) => services.notes.noteLanguage(noteId),
    pipeline: { chat },
  });
}
