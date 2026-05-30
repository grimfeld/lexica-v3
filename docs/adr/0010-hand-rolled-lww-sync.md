# Hand-rolled LWW sync over SQLite + PocketBase

Cloud mode keeps two copies of the truth — local SQLite (offline-first source
of truth per device) and PocketBase (shared across devices). Reconciliation is
hand-rolled rather than delegated to a sync engine (PowerSync, ElectricSQL,
RxDB, Replicache).

The sync policy is deliberately minimal: single-user, no real-time
collaboration, last-write-wins per Note for content and last-*review*-wins for
FSRS state (a more recent actual review is the truer memory signal). Sync
engines earn their cost on CRDTs / multiplayer / complex merge — none of which
apply here — and most assume their own backend conventions, so bolting one onto
PocketBase is friction.

Foundation: every synced record carries `updated_at` and a `dirty` flag; each
device keeps a `last_synced_at` watermark. On reconnect, changed records are
pushed/pulled; records changed on both sides resolve by the LWW policy; deletes
are tracked explicitly (tombstones) so "gone locally" is not confused with
"never synced".

The reconciler is isolated behind a single module so PowerSync (the most
PocketBase-friendly engine) can be swapped in later if review churn makes
hand-rolled sync painful.
