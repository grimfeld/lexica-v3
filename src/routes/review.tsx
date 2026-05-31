import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveLanguage } from "../languages/activeLanguage";
import { services } from "../services";
import { deserializeState, isDue } from "../scheduling/engine";
import { buildSessionQueue } from "../scheduling/queue";
import { assembleReviewItems, type DueCard, type NoteSource } from "../review/assemble";
import { dueCardsForDeck } from "../decks/deck-session";
import { ReviewSession } from "../review/ReviewSession";
import { getNoteType, ipaFields } from "../note-types";

export const Route = createFileRoute("/review")({
  validateSearch: (s: Record<string, unknown>): { deck?: string } => ({
    deck: typeof s.deck === "string" ? s.deck : undefined,
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const qc = useQueryClient();
  const activeId = useActiveLanguage((s) => s.activeId);
  const { deck } = Route.useSearch();

  const { data, refetch } = useQuery({
    queryKey: ["review", activeId, deck],
    enabled: !!activeId,
    queryFn: async () => {
      const now = new Date();
      const rows = await services.notes.reviewableCards(activeId!);

      // Due cards + the note sources needed to derive their render payloads.
      const notes = new Map<string, NoteSource>();
      let due: DueCard[] = [];
      for (const r of rows) {
        if (!isDue(deserializeState(r.fsrs), now)) continue;
        due.push({ cardId: r.cardId, noteId: r.noteId, sliceKey: r.sliceKey, ipa: null });
        if (!notes.has(r.noteId)) {
          notes.set(r.noteId, { id: r.noteId, type: r.type, fields: JSON.parse(r.fields) });
        }
      }

      if (deck) {
        const deckNoteIds = await services.decks.noteIdsInDeck(deck);
        due = dueCardsForDeck(due, deckNoteIds);
      }

      // Attach stored IPA (display-only, ADR-0002) for each card's note. A card
      // shows the pronunciation of its note's primary IPA-bearing field.
      const ipaByNote = new Map<string, string | null>();
      await Promise.all(
        [...notes.values()].map(async (n) => {
          const primary = ipaFields(getNoteType(n.type))[0];
          if (!primary) return;
          const map = await services.pronunciations.getForNote(n.id);
          ipaByNote.set(n.id, map[primary] ?? null);
        }),
      );
      for (const d of due) d.ipa = ipaByNote.get(d.noteId) ?? null;

      const ordered = buildSessionQueue(
        due.map((d) => ({ id: d.cardId, noteId: d.noteId, due: now })),
        now,
      );
      const byId = new Map(due.map((d) => [d.cardId, d]));
      const items = assembleReviewItems(
        ordered.map((o) => byId.get(o.id)!),
        notes,
      );
      return items;
    },
  });

  if (!activeId) {
    return <p className="text-[var(--color-ink-muted)]">Add a language to start.</p>;
  }
  if (!data) return <p className="text-[var(--color-ink-muted)]">Loading…</p>;

  return (
    <ReviewSession
      key={data.map((i) => i.cardId).join(",")}
      items={data}
      onGrade={(cardId, pass) => {
        void services.notes.gradeCard(cardId, pass);
      }}
      onDone={() => {
        void qc.invalidateQueries({ queryKey: ["review", activeId, deck] });
        void refetch();
      }}
    />
  );
}
