import { tauriExecutor } from "./notes/executor";
import { createNotesRepository } from "./notes/repository";
import { createDecksRepository } from "./decks/repository";
import { createLanguagesRepository } from "./languages/repository";
import { createStatsQuery } from "./stats/query";
import { createBackup } from "./backup/backup";
import { createPronunciationsRepository } from "./ipa/repository";

/*
 * The single composition root: every repository bound to the live Tauri SQL
 * executor and a real clock. Pages consume `services`; tests construct repos
 * directly with a fake executor, so nothing here is imported in unit tests.
 *
 * Date.now is read lazily inside the closure so the rule against it elsewhere
 * stays confined to this one boundary.
 */
const now = () => Date.now();

export const services = {
  notes: createNotesRepository(tauriExecutor, now),
  decks: createDecksRepository(tauriExecutor, now),
  languages: createLanguagesRepository(tauriExecutor, now),
  stats: createStatsQuery(tauriExecutor),
  backup: createBackup(tauriExecutor, now),
  pronunciations: createPronunciationsRepository(tauriExecutor, now),
};

export type Services = typeof services;
