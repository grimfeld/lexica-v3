/**
 * Resolves the effective active Language id against the available set. If the
 * persisted active id is missing or no longer exists (e.g. its Language was
 * deleted), fall back to the first available Language, or null if there are
 * none. Keeps the partition pointer always valid.
 */
export function resolveActiveLanguage(
  activeId: string | null,
  available: { id: string }[],
): string | null {
  if (activeId && available.some((l) => l.id === activeId)) return activeId;
  return available[0]?.id ?? null;
}
