import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

/*
 * Bridges the backup codec to the OS file picker (Tauri dialog + fs). Lets a
 * local-mode user write a backup to any drive and read one back — the manual
 * "sync by hand" path for local Storage Mode.
 */

const FILTERS = [{ name: "Lexica backup", extensions: ["json"] }];

/** Prompt for a save location and write the bundle. Returns false if cancelled. */
export async function writeBundleToFile(json: string): Promise<boolean> {
  const path = await save({ filters: FILTERS, defaultPath: "lexica-backup.json" });
  if (!path) return false;
  await writeTextFile(path, json);
  return true;
}

/** Prompt for a file and read its contents. Returns null if cancelled. */
export async function readBundleFromFile(): Promise<string | null> {
  const path = await open({ filters: FILTERS, multiple: false, directory: false });
  if (!path || typeof path !== "string") return null;
  return readTextFile(path);
}
