/**
 * Wrap the selected span [start, end) in {{ }} to mark it as a cloze blank.
 * Returns the text unchanged when the selection is empty or already inside a
 * blank marker.
 */
export function wrapSelectionAsBlank(
  text: string,
  start: number,
  end: number,
): string {
  if (start >= end) return text;
  const selected = text.slice(start, end);
  if (selected.includes("{{") || selected.includes("}}")) return text;
  return text.slice(0, start) + `{{${selected}}}` + text.slice(end);
}
