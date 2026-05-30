import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useActiveLanguage } from "../languages/activeLanguage";
import { StatsView, type DeckStat } from "../stats/StatsView";
import { services } from "../services";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function StatsPage() {
  const activeId = useActiveLanguage((s) => s.activeId);

  const { data } = useQuery({
    queryKey: ["stats", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const overall = await services.stats.forLanguage(activeId!);
      const decks = await services.decks.listDecks(activeId!);
      const perDeck: DeckStat[] = await Promise.all(
        decks.map(async (d) => ({
          deckId: d.id,
          name: d.name,
          stats: await services.stats.forDeck(d.id),
        })),
      );
      return { overall, perDeck };
    },
  });

  if (!activeId) {
    return <p className="text-[var(--color-ink-muted)]">Add a language to start.</p>;
  }
  if (!data) return <p className="text-[var(--color-ink-muted)]">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl">Progress</h2>
      <StatsView overall={data.overall} perDeck={data.perDeck} />
    </div>
  );
}
