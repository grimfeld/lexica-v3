import type { PronunciationsRepository, PronRow } from "./repository";
import { resolveIpa, type PipelineDeps } from "./pipeline";

/*
 * The async IPA backfill job (ADR-0002): drain queued pronunciation rows
 * (pending + failed-for-retry), resolve each through the pipeline, and store the
 * result. Note authoring never waits on this — it runs after a save and once on
 * app load. Bounded per pass so it can't run away; failures are left as 'failed'
 * and picked up on the next pass.
 *
 * Dependencies are injected (repo, a noteId->languageId resolver, and the
 * pipeline deps) so the drain logic unit-tests without DB, network, or a key.
 */

export interface BackfillDeps {
  repo: Pick<PronunciationsRepository, "listQueued" | "resolve">;
  /** Map a pronunciation row's note to its language (IPA is language-specific). */
  languageOf: (noteId: string) => Promise<string | null>;
  pipeline: PipelineDeps;
  /** Max rows processed per pass. */
  batchSize?: number;
}

export interface BackfillSummary {
  processed: number;
  filled: number;
  failed: number;
}

export async function runBackfill(deps: BackfillDeps): Promise<BackfillSummary> {
  const batch = deps.batchSize ?? 25;
  const queued: PronRow[] = await deps.repo.listQueued(batch);

  let filled = 0;
  let failed = 0;

  for (const row of queued) {
    const languageId = await deps.languageOf(row.noteId);
    if (!languageId) {
      // Note vanished (deleted) — mark done with no IPA so it stops re-queuing.
      await deps.repo.resolve(row.id, null, false);
      continue;
    }
    const res = await resolveIpa(languageId, row.sourceText, deps.pipeline);
    await deps.repo.resolve(row.id, res.ipa, res.failed);
    if (res.failed) failed++;
    else if (res.ipa) filled++;
  }

  return { processed: queued.length, filled, failed };
}
