import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";

/*
 * Read a plain-text document the user wants to extract candidates from. Only
 * .txt/.md for now — PDF parsing is deferred; pasting text (the dialog's other
 * input) already covers "I copied this from a PDF / a web page".
 */

const FILTERS = [{ name: "Text", extensions: ["txt", "md", "markdown"] }];

/** Prompt for a text file and read it. Returns null if cancelled. */
export async function readDocFile(): Promise<string | null> {
  const path = await open({ filters: FILTERS, multiple: false, directory: false });
  if (!path || typeof path !== "string") return null;
  return readTextFile(path);
}
