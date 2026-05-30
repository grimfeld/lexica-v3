import { defineConfig } from "drizzle-kit";

// Drizzle Kit generates SQL migrations from src/db/schema.ts. At runtime the
// app applies them through the Tauri SQL plugin (SQLite on-device).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./src-tauri/migrations",
});
