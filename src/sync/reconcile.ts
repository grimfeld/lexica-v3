/*
 * The hand-rolled LWW reconciler (ADR-0010) — isolated so it can be swapped for
 * a sync engine later, and pure so the data-loss landmine is fully unit-tested.
 *
 * Policy:
 *  - Content records resolve last-write-wins by `updatedAt`.
 *  - Card FSRS state resolves last-REVIEW-wins: the side whose card was reviewed
 *    more recently is the truer memory signal, even if the other side's row was
 *    touched later (e.g. a metadata-only bump). `lastReviewAt` carries that.
 *  - Deletes are tombstones (`deletedAt`); a delete competes with an edit by the
 *    same LWW timestamp comparison, so the more recent action wins.
 *  - Ties (equal timestamps) favour the remote/shared copy for determinism.
 */

export interface SyncRecord {
  id: string;
  updatedAt: number;
  /** Tombstone time, or null if live. */
  deletedAt: number | null;
  /** For cards: the FSRS last_review epoch ms; absent for content records. */
  lastReviewAt?: number | null;
}

export type Winner = "local" | "remote" | "equal";

export interface Resolution {
  id: string;
  winner: Winner;
  /** What the caller should do to converge. */
  action: "push" | "pull" | "noop";
}

/** Effective comparison time for a record under the active policy. */
function compareKey(r: SyncRecord, useReview: boolean): number {
  if (useReview && r.lastReviewAt != null) return r.lastReviewAt;
  return r.updatedAt;
}

/**
 * Decide one record present on both sides. `useReview` selects the
 * last-review-wins policy (cards) over plain LWW (content).
 */
export function resolvePair(
  local: SyncRecord,
  remote: SyncRecord,
  useReview = false,
): Resolution {
  const l = compareKey(local, useReview);
  const r = compareKey(remote, useReview);
  if (l > r) return { id: local.id, winner: "local", action: "push" };
  if (r > l) return { id: local.id, winner: "remote", action: "pull" };
  // Tie -> prefer the shared copy; nothing to push.
  return { id: local.id, winner: "equal", action: "noop" };
}

export interface ReconcilePlan {
  /** Local records to push to the server (new locally, or local won). */
  push: string[];
  /** Remote records to apply locally (new remotely, or remote won). */
  pull: string[];
}

/**
 * Reconcile two full record sets (one table). Records on only one side are moved
 * to the other; records on both sides resolve by policy. Returns the ids to
 * push / pull — the caller carries the actual row data and performs the writes.
 */
export function reconcile(
  localRecords: SyncRecord[],
  remoteRecords: SyncRecord[],
  useReview = false,
): ReconcilePlan {
  const localById = new Map(localRecords.map((r) => [r.id, r]));
  const remoteById = new Map(remoteRecords.map((r) => [r.id, r]));
  const push: string[] = [];
  const pull: string[] = [];

  for (const local of localRecords) {
    const remote = remoteById.get(local.id);
    if (!remote) {
      push.push(local.id); // new (or only) locally
      continue;
    }
    const res = resolvePair(local, remote, useReview);
    if (res.action === "push") push.push(local.id);
    else if (res.action === "pull") pull.push(local.id);
  }

  for (const remote of remoteRecords) {
    if (!localById.has(remote.id)) pull.push(remote.id); // new (or only) remotely
  }

  return { push, pull };
}
