import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveLanguage } from "../languages/activeLanguage";
import { DeckList, type DeckSummary } from "../decks/DeckList";
import { services } from "../services";

export const Route = createFileRoute("/decks")({
  component: DecksPage,
});

function DecksPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const activeId = useActiveLanguage((s) => s.activeId);

  const { data: decks = [] } = useQuery({
    queryKey: ["decks", activeId],
    queryFn: async (): Promise<DeckSummary[]> => {
      const rows = await services.decks.listDecks(activeId!);
      return Promise.all(
        rows.map(async (d) => ({
          id: d.id,
          name: d.name,
          noteCount: (await services.decks.noteIdsInDeck(d.id)).length,
        })),
      );
    },
    enabled: !!activeId,
  });

  if (!activeId) {
    return <p className="text-[var(--color-ink-muted)]">Add a language to start.</p>;
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: ["decks", activeId] });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl">Decks</h2>
      <DeckList
        decks={decks}
        onCreate={async (name) => {
          await services.decks.createDeck({ id: crypto.randomUUID(), languageId: activeId, name });
          await invalidate();
        }}
        onRename={async (id, name) => {
          await services.decks.renameDeck(id, name);
          await invalidate();
        }}
        onDelete={async (id) => {
          await services.decks.deleteDeck(id);
          await invalidate();
        }}
        onReview={(id) => navigate({ to: "/review", search: { deck: id } })}
      />
    </div>
  );
}
