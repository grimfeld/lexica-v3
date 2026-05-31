import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveLanguage } from "../languages/activeLanguage";
import { NoteAuthoringShell } from "../notes/NoteAuthoringShell";
import { services } from "../services";
import { getNoteType, type FieldValues } from "../note-types";
import { AuthoringAssist } from "../ai/AuthoringAssist";
import { ExtractDialog } from "../ai/ExtractDialog";
import { runAssist, runExtract, chatProviderLabel } from "../ai";
import { readDocFile } from "../ai/doc-read";
import type { Candidate } from "../ai/extract";
import { enqueueNoteIpa, backfillIpa } from "../ipa/run";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
});

interface NoteRow {
  id: string;
  type: string;
  fields: string;
  paused: number;
}

function NotesPage() {
  const qc = useQueryClient();
  const activeId = useActiveLanguage((s) => s.activeId);

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", activeId],
    queryFn: () => services.notes.listByLanguage(activeId!),
    enabled: !!activeId,
  });

  // Show the AI assist panel only when a chat-capable key is configured.
  const { data: assistLabel } = useQuery({
    queryKey: ["byok-chat-label"],
    queryFn: () => chatProviderLabel(),
  });

  if (!activeId) {
    return <p className="text-[var(--color-ink-muted)]">Add a language to start.</p>;
  }

  async function createNote(note: { type: string; fields: FieldValues }) {
    const id = crypto.randomUUID();
    await services.notes.createNote({
      id,
      languageId: activeId!,
      type: note.type,
      fields: note.fields,
    });
    await qc.invalidateQueries({ queryKey: ["notes", activeId] });
    // Queue + backfill pronunciation in the background; authoring doesn't wait.
    await enqueueNoteIpa(id, note.type, note.fields);
    void backfillIpa();
  }

  async function acceptCandidates(accepted: Candidate[]) {
    // Each candidate is already type-shaped + validated by the extractor; this
    // only persists the ones the user explicitly selected.
    for (const c of accepted) {
      const id = crypto.randomUUID();
      await services.notes.createNote({
        id,
        languageId: activeId!,
        type: c.type,
        fields: c.fields,
      });
      await enqueueNoteIpa(id, c.type, c.fields);
    }
    await qc.invalidateQueries({ queryKey: ["notes", activeId] });
    void backfillIpa();
  }

  async function remove(id: string) {
    await services.notes.deleteNote(id);
    await qc.invalidateQueries({ queryKey: ["notes", activeId] });
  }

  async function togglePause(n: NoteRow) {
    await services.notes.setPaused(n.id, !n.paused);
    await qc.invalidateQueries({ queryKey: ["notes", activeId] });
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-xl">Add a note</h2>
        <NoteAuthoringShell
          onSave={createNote}
          renderAssist={
            assistLabel
              ? ({ typeId, fillFields }) => (
                  <AuthoringAssist
                    providerLabel={assistLabel}
                    onAssist={(seed) => runAssist(typeId, seed)}
                    onFill={fillFields}
                  />
                )
              : undefined
          }
        />
      </section>

      {assistLabel && (
        <section>
          <h2 className="mb-3 text-xl">Extract from a document</h2>
          <ExtractDialog
            providerLabel={assistLabel}
            onExtract={runExtract}
            onPickFile={readDocFile}
            onAccept={acceptCandidates}
          />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl">Notes</h2>
        <ul className="flex flex-col gap-2">
          {(notes as NoteRow[]).map((n) => {
            const label = summarize(n);
            return (
              <li
                key={n.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
              >
                <span className={n.paused ? "text-[var(--color-ink-muted)]" : undefined}>
                  {label} {n.paused && "· paused"}
                </span>
                <div className="flex gap-2 text-sm">
                  <button onClick={() => togglePause(n)}>
                    {n.paused ? "Resume" : "Pause"}
                  </button>
                  <button className="text-[var(--color-miss)]" onClick={() => remove(n.id)}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
          {notes.length === 0 && (
            <li className="text-[var(--color-ink-muted)]">No notes yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

/** A short, type-aware label for a note row (first field value). */
function summarize(n: NoteRow): string {
  try {
    const fields = JSON.parse(n.fields) as FieldValues;
    const first = getNoteType(n.type).fields[0]?.key;
    const v = first ? fields[first] : "";
    return typeof v === "string" && v ? v : "(untitled)";
  } catch {
    return "(untitled)";
  }
}
