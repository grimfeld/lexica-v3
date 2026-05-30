/** Primary navigation areas, shared by both layouts (ADR-0011). */
export interface NavItem {
  to: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/notes", label: "Notes" },
  { to: "/decks", label: "Decks" },
  { to: "/review", label: "Review" },
  { to: "/stats", label: "Stats" },
  { to: "/settings", label: "Settings" },
];
