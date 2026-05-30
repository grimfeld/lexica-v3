import type { NoteTypeModule } from "./contract";

/*
 * The Note Type registry. Adding a type = registering one module here. The rest
 * of the app (authoring shell, review shell, AI features) looks types up by id;
 * it never hardcodes a concrete type.
 */

const registry = new Map<string, NoteTypeModule>();

export function registerNoteType(module: NoteTypeModule): void {
  if (registry.has(module.id)) {
    throw new Error(`Note Type already registered: ${module.id}`);
  }
  registry.set(module.id, module);
}

export function getNoteType(id: string): NoteTypeModule {
  const module = registry.get(id);
  if (!module) {
    throw new Error(`Unknown Note Type: ${id}`);
  }
  return module;
}

export function listNoteTypes(): NoteTypeModule[] {
  return [...registry.values()];
}

/** Test-only: clear the registry between cases. */
export function __resetRegistry(): void {
  registry.clear();
}
