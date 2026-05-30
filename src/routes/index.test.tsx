import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
} from "@tanstack/react-router";
import { Home } from "./index";

// Smoke test: the home route renders the app name. Verifies the test harness
// (Vitest + RTL + jsdom) and routing render path are wired correctly.
describe("Home route", () => {
  it("renders the app name", async () => {
    const rootRoute = createRootRoute();
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: Home,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });

    render(<RouterProvider router={router as never} />);

    expect(await screen.findByRole("heading", { name: "Lexica" })).toBeInTheDocument();
  });
});
