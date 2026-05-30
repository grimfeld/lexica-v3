import { createFileRoute, redirect } from "@tanstack/react-router";

/*
 * Landing depends on device, but routing-wise both lead into the app. Desktop
 * lands on Notes (authoring station), mobile on Review (companion) — the layout
 * decides emphasis; we default the route to Notes and let mobile users tap
 * Review. (ADR-0011)
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/notes" });
  },
});
