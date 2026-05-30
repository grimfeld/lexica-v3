import type { RetentionStats } from "./compute";

/*
 * Retention stats display (ADR-0005). Describes knowledge, not attendance —
 * deliberately no streaks, goals, or time-in-app. Plain and informational.
 */

export interface DeckStat {
  deckId: string;
  name: string;
  stats: RetentionStats;
}

export interface StatsViewProps {
  overall: RetentionStats;
  perDeck: DeckStat[];
}

function pct(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

function Row({ label, s }: { label: string; s: RetentionStats }) {
  return (
    <tr className="border-t border-[var(--color-border)]">
      <td className="py-2 pr-4">{label}</td>
      <td className="py-2 pr-4 tabular-nums">{pct(s.retentionRate)}</td>
      <td className="py-2 pr-4 tabular-nums">{s.matureCards}</td>
      <td className="py-2 tabular-nums">{s.totalCards}</td>
    </tr>
  );
}

export function StatsView({ overall, perDeck }: StatsViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <table className="text-left text-sm">
        <thead>
          <tr className="text-[var(--color-ink-muted)]">
            <th className="py-1 pr-4 font-normal" />
            <th className="py-1 pr-4 font-normal">Retention</th>
            <th className="py-1 pr-4 font-normal">Mature</th>
            <th className="py-1 font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          <Row label="All notes" s={overall} />
          {perDeck.map((d) => (
            <Row key={d.deckId} label={d.name} s={d.stats} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
