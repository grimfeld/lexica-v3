import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * The active Language. Everything the user sees is scoped to it; switching it
 * swaps the whole working set (Notes, Decks, sessions, stats — CONTEXT.md).
 * Persisted so the choice survives restarts.
 */

interface ActiveLanguageState {
  activeId: string | null;
  setActive: (id: string | null) => void;
}

export const useActiveLanguage = create<ActiveLanguageState>()(
  persist(
    (set) => ({
      activeId: null,
      setActive: (id) => set({ activeId: id }),
    }),
    { name: "lexica.activeLanguage" },
  ),
);
